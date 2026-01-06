import { CargoManifestData, ReciboBLEntry } from '@/types/recibo';

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

export const parseCargoManifest = async (file: File): Promise<CargoManifestData | null> => {
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
    
    console.log('Cargo Manifest PDF Text:', fullText);
    
    // Extract VESSEL
    const vesselMatch = fullText.match(/VESSEL[:\s]*(?:MV\s+)?([A-Z][A-Z\s]+?)(?=\s+MASTER|\s+PORT|\n)/i);
    const vessel = vesselMatch ? vesselMatch[1].trim() : '';
    
    // Extract PORT OF LOADING
    const portMatch = fullText.match(/PORT\s+OF\s+LOADING[:\s]*([A-Z][A-Z\s,]+?)(?=\s+DATE|\s+PORT\s+OF\s+DISCHARGE|\n)/i);
    const port = portMatch ? portMatch[1].trim() : '';
    
    // Extract BL entries
    const entries: ReciboBLEntry[] = [];
    
    // Pattern to match BL entries: B/L No. XX followed by shipper name and quantity
    // The format is: B/L No. 01 | SHIPPER NAME | ... | XX,XXX.XXX METRIC TONS
    const blPattern = /B\/L\s*(?:No\.?\s*)?(\d+)\s+([A-Z][A-Z\s\.\/\-&]+?)(?=\s+TO\s+ORDER|\s+CONSIGNEE)/gi;
    const quantityPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*METRIC\s*TONS/gi;
    
    // Split by B/L entries
    const blSections = fullText.split(/(?=B\/L\s*(?:No\.?\s*)?\d+)/gi);
    
    for (const section of blSections) {
      const blMatch = section.match(/B\/L\s*(?:No\.?\s*)?(\d+)\s+([A-Z][A-Z\s\.\/\-&]+?)(?=\s+TO\s+ORDER|\s+CONSIGNEE)/i);
      const qtyMatch = section.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*METRIC\s*TONS/i);
      
      if (blMatch && qtyMatch) {
        const blNumber = blMatch[1];
        let shipper = blMatch[2].trim();
        // Clean up shipper name
        shipper = shipper.replace(/\s+/g, ' ').trim();
        
        // Parse quantity - remove commas and parse
        const quantityStr = qtyMatch[1].replace(/,/g, '');
        const quantity = parseFloat(quantityStr);
        
        entries.push({
          blNumber,
          shipper,
          quantity
        });
      }
    }
    
    console.log('Parsed Cargo Manifest:', { vessel, port, entries });
    
    if (!vessel && !port && entries.length === 0) {
      return null;
    }
    
    return {
      vessel,
      port,
      entries
    };
  } catch (error) {
    console.error('Error parsing Cargo Manifest PDF:', error);
    return null;
  }
};

// Group entries by shipper and sum quantities
export const groupByShipper = (entries: ReciboBLEntry[]): Map<string, { blNumbers: string[]; totalQuantity: number }> => {
  const grouped = new Map<string, { blNumbers: string[]; totalQuantity: number }>();
  
  for (const entry of entries) {
    const existing = grouped.get(entry.shipper);
    if (existing) {
      existing.blNumbers.push(entry.blNumber);
      existing.totalQuantity += entry.quantity;
    } else {
      grouped.set(entry.shipper, {
        blNumbers: [entry.blNumber],
        totalQuantity: entry.quantity
      });
    }
  }
  
  return grouped;
};
