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
    
    console.log('Extracted PDF Text:', fullText);
    
    // Extract VESSEL - look for "VESSEL:" followed by the name
    let vessel = '';
    const vesselMatch = fullText.match(/VESSEL\s*:\s*(?:MV\s+)?([A-Z][A-Z0-9\s\-]+?)(?=\s+MASTER|\s+PORT|\s+DATE|\s+[A-Z]+:)/i);
    if (vesselMatch) {
      vessel = vesselMatch[1].trim();
    }
    console.log('Extracted vessel:', vessel);
    
    // Extract PORT OF LOADING
    let port = '';
    const portMatch = fullText.match(/PORT\s+OF\s+LOADING\s*:\s*([A-Z][A-Z\s,\-]+?)(?=\s+DATE|\s+PORT\s+OF\s+DISCHARGE|\s+[A-Z]+:)/i);
    if (portMatch) {
      port = portMatch[1].trim();
      // Remove ", BRAZIL" if present
      port = port.replace(/,?\s*BRAZIL\s*$/i, '').trim();
    }
    console.log('Extracted port:', port);
    
    // Extract BL entries from table
    // The table format is: B/L nbr | SHIPPER | CONSIGNEE | ... | QUANTITY
    const entries: ReciboBLEntry[] = [];
    
    // Pattern to find table rows with B/L number, shipper, and quantity
    // Format: BL_NUMBER + SHIPPER_NAME (ending in LTDA, LLC, etc.) + ... + QUANTITY METRIC TONS
    // The shipper name ends when we see a company suffix followed by a space and another company name (consignee)
    const tableRowPattern = /\b(\d{1,4})\s+([A-Z][A-Z\s\.\/\-&,]+?(?:LTDA|LLC|INC|CORP|SA|S\.A\.|LTD))\s+(?:[A-Z].*?)?(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*METRIC\s*TONS?/gi;
    
    let match;
    while ((match = tableRowPattern.exec(fullText)) !== null) {
      const blNumber = match[1];
      let shipper = match[2].trim().replace(/\s+/g, ' ');
      const quantityStr = match[3].replace(/,/g, '');
      const quantity = parseFloat(quantityStr);
      
      if (blNumber && shipper && quantity > 0) {
        entries.push({
          blNumber,
          shipper,
          quantity
        });
        console.log(`Found entry: BL ${blNumber}, Shipper: ${shipper}, Quantity: ${quantity}`);
      }
    }
    
    // Alternative approach: look for individual patterns if table parsing fails
    if (entries.length === 0) {
      console.log('Table parsing failed, trying alternative approach...');
      
      // Find all BL numbers (1-4 digits at start of table row)
      const blMatches = [...fullText.matchAll(/\b(\d{1,4})\s+([A-Z][A-Z\s\.\/\-&,]+?(?:LTDA?|LLC|INC|CORP|SA|S\.A\.|LTD)?\b)/gi)];
      
      // Find all quantities
      const qtyMatches = [...fullText.matchAll(/(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*METRIC\s*TONS?/gi)];
      
      console.log('BL matches:', blMatches.map(m => ({ bl: m[1], shipper: m[2] })));
      console.log('Quantity matches:', qtyMatches.map(m => m[1]));
      
      // If we have equal numbers of BLs and quantities, match them
      if (blMatches.length > 0 && blMatches.length === qtyMatches.length) {
        for (let i = 0; i < blMatches.length; i++) {
          const blNumber = blMatches[i][1];
          let shipper = blMatches[i][2].trim().replace(/\s+/g, ' ');
          const quantityStr = qtyMatches[i][1].replace(/,/g, '');
          const quantity = parseFloat(quantityStr);
          
          if (blNumber && shipper && quantity > 0) {
            entries.push({
              blNumber,
              shipper,
              quantity
            });
            console.log(`Found entry (alt): BL ${blNumber}, Shipper: ${shipper}, Quantity: ${quantity}`);
          }
        }
      }
    }
    
    // Third approach: simpler pattern for structured table
    if (entries.length === 0) {
      console.log('Trying simpler pattern...');
      
      // Split text and look for patterns
      const parts = fullText.split(/\s+/);
      
      for (let i = 0; i < parts.length; i++) {
        // Look for a small number (1-4 digits) that could be a BL
        if (/^\d{1,4}$/.test(parts[i])) {
          const blNumber = parts[i];
          
          // Look for company name after BL number
          let shipperParts: string[] = [];
          let j = i + 1;
          while (j < parts.length && /^[A-Z]/.test(parts[j]) && !/^\d/.test(parts[j])) {
            shipperParts.push(parts[j]);
            j++;
            // Stop at known end markers
            if (parts[j-1].match(/LTDA?|LLC|INC|CORP|SA|LTD$/i)) break;
            if (shipperParts.length > 10) break; // Safety limit
          }
          
          if (shipperParts.length >= 2) {
            const shipper = shipperParts.join(' ');
            
            // Look for quantity (METRIC TONS) after this position
            const remainingText = parts.slice(j).join(' ');
            const qtyMatch = remainingText.match(/(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d+)?)\s*METRIC\s*TONS?/i);
            
            if (qtyMatch) {
              const quantityStr = qtyMatch[1].replace(/,/g, '');
              const quantity = parseFloat(quantityStr);
              
              if (quantity > 0) {
                entries.push({
                  blNumber,
                  shipper,
                  quantity
                });
                console.log(`Found entry (simple): BL ${blNumber}, Shipper: ${shipper}, Quantity: ${quantity}`);
              }
            }
          }
        }
      }
    }
    
    console.log('Parsed entries:', entries);
    
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
