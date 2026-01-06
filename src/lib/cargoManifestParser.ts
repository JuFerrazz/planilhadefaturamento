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
    
    // Extract VESSEL - look for "VESSEL:" or "VESSEL" followed by MV
    let vessel = '';
    const vesselMatch = fullText.match(/VESSEL\s*:?\s*(?:MV\s+)?([A-Z][A-Z\s\-]+?)(?=\s+MASTER|\s+PORT|\s+DATE|\n|$)/i);
    if (vesselMatch) {
      vessel = vesselMatch[1].trim();
    }
    
    // Extract PORT OF LOADING
    let port = '';
    const portMatch = fullText.match(/PORT\s+OF\s+LOADING\s*:?\s*([A-Z][A-Z\s,\-]+?)(?=\s+DATE|\s+PORT\s+OF\s+DISCHARGE|\s+BRAZIL|\n|$)/i);
    if (portMatch) {
      port = portMatch[1].trim();
      // Clean up port name
      port = port.replace(/,?\s*BRAZIL\s*$/i, '').trim();
    }
    
    // Extract BL entries - pattern: B/L No. XX followed by SHIPPER NAME
    const entries: ReciboBLEntry[] = [];
    
    // Match pattern: B/L No. XX SHIPPER_NAME ... XX,XXX.XXX METRIC TONS
    const blRegex = /B\/L\s*No\.?\s*(\d+)\s+([A-Z][A-Z\s\.\/\-&]+?)(?=\s+TO\s+ORDER|\s+CONSIGNEE)/gi;
    let match;
    
    // Store all matches with their positions
    const blMatches: { blNumber: string; shipper: string; position: number }[] = [];
    while ((match = blRegex.exec(fullText)) !== null) {
      blMatches.push({
        blNumber: match[1],
        shipper: match[2].trim().replace(/\s+/g, ' '),
        position: match.index
      });
    }
    
    // For each BL, find the quantity that follows
    for (let i = 0; i < blMatches.length; i++) {
      const bl = blMatches[i];
      const nextBlPos = i + 1 < blMatches.length ? blMatches[i + 1].position : fullText.length;
      const section = fullText.substring(bl.position, nextBlPos);
      
      // Find quantity in this section
      const qtyMatch = section.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*METRIC\s*TONS/i);
      
      if (qtyMatch) {
        const quantityStr = qtyMatch[1].replace(/,/g, '');
        const quantity = parseFloat(quantityStr);
        
        entries.push({
          blNumber: bl.blNumber,
          shipper: bl.shipper,
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
