import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

export interface ParsedDUEData {
  duE: string;
  shipperCnpj: string;
  shipperName: string;
  grossWeight: number;
}

export const parseDUEPdf = async (file: File): Promise<ParsedDUEData | null> => {
  try {
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
    // Pattern: CNPJ followed by company name
    const cnpjPattern = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+([A-Z][A-Z\s\.\-&]+(?:S\.?A\.?|LTDA\.?|ME|EPP|EIRELI)?)/gi;
    
    let shipperCnpj = '';
    let shipperName = '';
    
    // Find matches after "Exportadores"
    const exportadoresIndex = fullText.toLowerCase().indexOf('exportadores');
    if (exportadoresIndex !== -1) {
      const afterExportadores = fullText.substring(exportadoresIndex);
      const match = cnpjPattern.exec(afterExportadores);
      if (match) {
        shipperCnpj = match[1];
        shipperName = match[2].trim().toUpperCase();
      }
    }
    
    // Fallback - find any CNPJ pattern
    if (!shipperCnpj) {
      cnpjPattern.lastIndex = 0;
      const match = cnpjPattern.exec(fullText);
      if (match) {
        shipperCnpj = match[1];
        shipperName = match[2].trim().toUpperCase();
      }
    }
    
    // Extract Peso Líquido (KG)
    // Look for pattern like "30.000.000,00000" after "Peso líquido" or "KG"
    const pesoMatch = fullText.match(/Peso\s*l[íi]quido\s*\(?\s*KG\s*\)?[^\d]*(\d{1,3}(?:\.\d{3})*,\d+)/i) 
      || fullText.match(/(\d{1,3}(?:\.\d{3})*,\d{5})/); // Fallback: find number with 5 decimal places
    
    let grossWeight = 0;
    
    if (pesoMatch) {
      const pesoStr = pesoMatch[1];
      // Parse Brazilian number format: 30.000.000,00000
      const pesoKg = parseFloat(pesoStr.replace(/\./g, '').replace(',', '.'));
      // Convert KG to MT (divide by 1000)
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
