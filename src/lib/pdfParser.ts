export interface ParsedDUEData {
  duE: string;
  shipperCnpj: string;
  shipperName: string;
  grossWeight: number;
}

// Load PDF.js from CDN dynamically
const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjs);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const parseDUEPdf = async (file: File): Promise<ParsedDUEData | null> => {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('PDF Text extracted:', fullText.substring(0, 500));
    
    // Extract DUE - starts with 25BR, remove hyphens
    const dueMatch = fullText.match(/25BR\d+[-]?\d*/);
    const duE = dueMatch ? dueMatch[0].replace(/-/g, '') : '';
    
    // Extract CNPJ and company name from Exportadores section
    // Pattern captures CNPJ followed by company name that ends with S/A, S.A., LTDA, etc.
    const cnpjPattern = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+([A-Z][A-Z0-9\s\.\-&\/]+?(?:S\/?A\.?|S\.A\.?|LTDA\.?|ME|EPP|EIRELI))(?=\s|$)/gi;
    
    let shipperCnpj = '';
    let shipperName = '';
    
    // Find matches after "Exportadores"
    const exportadoresIndex = fullText.toLowerCase().indexOf('exportadores');
    if (exportadoresIndex !== -1) {
      const afterExportadores = fullText.substring(exportadoresIndex);
      const match = cnpjPattern.exec(afterExportadores);
      if (match) {
        shipperCnpj = match[1];
        // Clean up shipper name
        let rawName = match[2].trim().toUpperCase();
        // Normalize S/A to S.A.
        rawName = rawName.replace(/S\/A\.?$/i, 'S.A.');
        // Remove "Forma de exportação" and everything after it
        rawName = rawName.replace(/\s+FORMA\s+DE\s+EXPORTA[ÇC][ÃA]O.*$/i, '');
        // Clean up extra spaces
        shipperName = rawName.replace(/\s+/g, ' ').trim();
      }
    }
    
    // Fallback - find any CNPJ pattern
    if (!shipperCnpj) {
      cnpjPattern.lastIndex = 0;
      const match = cnpjPattern.exec(fullText);
      if (match) {
        shipperCnpj = match[1];
        let rawName = match[2].trim().toUpperCase();
        // Normalize S/A to S.A.
        rawName = rawName.replace(/S\/A\.?$/i, 'S.A.');
        // Remove "Forma de exportação" and everything after it
        rawName = rawName.replace(/\s+FORMA\s+DE\s+EXPORTA[ÇC][ÃA]O.*$/i, '');
        // Clean up extra spaces
        shipperName = rawName.replace(/\s+/g, ' ').trim();
      }
    }
    
    // Extract Peso Líquido (KG)
    const pesoMatch = fullText.match(/Peso\s*l[íi]quido\s*\(?\s*KG\s*\)?[^\d]*(\d{1,3}(?:\.\d{3})*,\d+)/i) 
      || fullText.match(/(\d{1,3}(?:\.\d{3})*,\d{5})/);
    
    let grossWeight = 0;
    
    if (pesoMatch) {
      const pesoStr = pesoMatch[1];
      const pesoKg = parseFloat(pesoStr.replace(/\./g, '').replace(',', '.'));
      grossWeight = pesoKg / 1000;
    }
    
    console.log('Parsed data:', { duE, shipperCnpj, shipperName, grossWeight });
    
    if (!duE && !shipperCnpj && !grossWeight) {
      return null;
    }
    
    return {
      duE,
      shipperCnpj,
      shipperName,
      grossWeight,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
};
