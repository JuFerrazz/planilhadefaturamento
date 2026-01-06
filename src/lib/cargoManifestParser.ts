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
    console.log('Starting PDF parsing for file:', file.name);
    
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
    
    console.log('Extracted PDF Text (first 500 chars):', fullText.substring(0, 500));
    
    // Extract VESSEL - multiple patterns
    let vessel = '';
    const vesselPatterns = [
      /VESSEL\s*:?\s*(?:MV\s+)?([A-Z][A-Z\s\-]+?)(?=\s+MASTER|\s+PORT|\s+DATE|\n|$)/i,
      /MV\s+([A-Z][A-Z\s\-]+?)(?=\s+MASTER|\s+PORT|\s+DATE|\n|$)/i,
      /VESSEL\s+NAME\s*:?\s*([A-Z][A-Z\s\-]+?)(?=\s+|\n|$)/i
    ];
    
    for (const pattern of vesselPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        vessel = match[1].trim();
        break;
      }
    }
    
    // Extract PORT OF LOADING - multiple patterns
    let port = '';
    const portPatterns = [
      /PORT\s+OF\s+LOADING\s*:?\s*([A-Z][A-Z\s,\-]+?)(?=\s+DATE|\s+PORT\s+OF\s+DISCHARGE|\s+BRAZIL|\n|$)/i,
      /LOADING\s+PORT\s*:?\s*([A-Z][A-Z\s,\-]+?)(?=\s+|\n|$)/i,
      /FROM\s+PORT\s*:?\s*([A-Z][A-Z\s,\-]+?)(?=\s+|\n|$)/i
    ];
    
    for (const pattern of portPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        port = match[1].trim();
        port = port.replace(/,?\s*BRAZIL\s*$/i, '').trim();
        break;
      }
    }
    
    // Extract BL entries - improved patterns
    const entries: ReciboBLEntry[] = [];
    
    // Multiple BL patterns to try
    const blPatterns = [
      /B\/L\s*(?:No\.?|NUMBER)\s*:?\s*(\d+)\s+([A-Z][A-Z\s\.\/\-&,]+?)(?=\s+(?:TO\s+ORDER|CONSIGNEE|NOTIFY|QUANTITY))/gi,
      /BL\s*(?:No\.?|NUMBER)\s*:?\s*(\d+)\s+([A-Z][A-Z\s\.\/\-&,]+?)(?=\s+(?:TO\s+ORDER|CONSIGNEE|NOTIFY|QUANTITY))/gi,
      /(?:^|\n)\s*(\d+)\s+([A-Z][A-Z\s\.\/\-&,]{10,}?)(?=\s+(?:TO\s+ORDER|CONSIGNEE|NOTIFY|\d+[,.]?\d*\s*(?:MT|METRIC)))/gim
    ];
    
    let allMatches: { blNumber: string; shipper: string; position: number }[] = [];
    
    for (const pattern of blPatterns) {
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
        const shipper = match[2].trim().replace(/\s+/g, ' ');
        // Filter out obvious non-shipper text
        if (shipper.length > 5 && !shipper.match(/^(TO\s+ORDER|CONSIGNEE|NOTIFY|QUANTITY)/i)) {
          allMatches.push({
            blNumber: match[1],
            shipper: shipper,
            position: match.index
          });
        }
      }
    }
    
    // Remove duplicates and sort by position
    const uniqueMatches = allMatches.filter((match, index, arr) => 
      arr.findIndex(m => m.blNumber === match.blNumber) === index
    ).sort((a, b) => a.position - b.position);
    
    console.log('Found BL matches:', uniqueMatches);
    
    // For each BL, find the quantity that follows
    for (let i = 0; i < uniqueMatches.length; i++) {
      const bl = uniqueMatches[i];
      const nextBlPos = i + 1 < uniqueMatches.length ? uniqueMatches[i + 1].position : fullText.length;
      const section = fullText.substring(bl.position, nextBlPos);
      
      // Multiple quantity patterns
      const qtyPatterns = [
        /(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*(?:MT|METRIC\s*TONS?)/i,
        /QUANTITY\s*:?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*(?:MT|METRIC\s*TONS?)/i,
        /(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*TONS?/i
      ];
      
      let quantity = 0;
      for (const qtyPattern of qtyPatterns) {
        const qtyMatch = section.match(qtyPattern);
        if (qtyMatch) {
          const quantityStr = qtyMatch[1].replace(/,/g, '');
          quantity = parseFloat(quantityStr);
          break;
        }
      }
      
      if (quantity > 0) {
        entries.push({
          blNumber: bl.blNumber,
          shipper: bl.shipper,
          quantity
        });
      }
    }
    
    console.log('Parsed entries:', entries);
    
    // If no structured data found, try to extract any meaningful info
    if (entries.length === 0) {
      console.log('No structured entries found, trying fallback extraction...');
      
      // Try to find any numbers that could be BL numbers
      const numberMatches = fullText.match(/\b\d{4,8}\b/g);
      if (numberMatches && numberMatches.length > 0) {
        console.log('Found potential BL numbers:', numberMatches.slice(0, 5));
      }
      
      // Try to find company names (sequences of capital letters)
      const companyMatches = fullText.match(/\b[A-Z][A-Z\s]{10,50}\b/g);
      if (companyMatches && companyMatches.length > 0) {
        console.log('Found potential company names:', companyMatches.slice(0, 5));
      }
    }
    
    if (!vessel && !port && entries.length === 0) {
      console.log('No data extracted from PDF');
      return null;
    }
    
    const result = {
      vessel: vessel || 'Não identificado',
      port: port || 'Não identificado',
      entries
    };
    
    console.log('Final parsed result:', result);
    return result;
    
  } catch (error) {
    console.error('Error parsing Cargo Manifest PDF:', error);
    return null;
  }
};

// Group entries by shipper and sum quantities
export const groupByShipper = (entries: ReciboBLEntry[]): Map<string, { blNumbers: string[]; totalQuantity: number }> => {
  const grouped = new Map<string, { blNumbers: string[]; totalQuantity: number }>();
  
  console.log('Grouping entries by shipper:', entries);
  
  for (const entry of entries) {
    // Normalize shipper name for comparison (remove extra spaces, convert to uppercase)
    const normalizedShipper = entry.shipper.trim().toUpperCase().replace(/\s+/g, ' ');
    
    // Find existing entry with same normalized shipper name
    let existingKey = '';
    for (const [key] of grouped) {
      if (key.trim().toUpperCase().replace(/\s+/g, ' ') === normalizedShipper) {
        existingKey = key;
        break;
      }
    }
    
    if (existingKey) {
      // Add to existing shipper
      const existing = grouped.get(existingKey)!;
      existing.blNumbers.push(entry.blNumber);
      existing.totalQuantity += entry.quantity;
      console.log(`Added BL ${entry.blNumber} to existing shipper "${existingKey}". New total: ${existing.totalQuantity}`);
    } else {
      // Create new shipper entry
      grouped.set(entry.shipper, {
        blNumbers: [entry.blNumber],
        totalQuantity: entry.quantity
      });
      console.log(`Created new shipper entry "${entry.shipper}" with BL ${entry.blNumber}, quantity: ${entry.quantity}`);
    }
  }
  
  console.log('Final grouped result:', Array.from(grouped.entries()));
  return grouped;
};
