import * as XLSX from 'xlsx';

export interface SugarEntry {
  blNumber: string;
  shipper: string;
  quantity: number;
  customsBroker: string;
}

export interface SugarReciboData {
  entries: SugarEntry[];
}

// Parse pasted text data (tab-separated or space-separated)
export const parsePastedData = (text: string): SugarReciboData | null => {
  try {
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return null;
    }
    
    // Parse header row
    const headerLine = lines[0];
    const headers = headerLine.split(/\t/).map(h => h.toLowerCase().trim());
    
    console.log('Pasted Headers:', headers);
    
    // Find column indices - look for exact or partial matches
    let blIndex = headers.findIndex(h => 
      h === 'bl nbr' || h.includes('bl nbr') || h.includes('bl number') || h === 'bl'
    );
    let shipperIndex = headers.findIndex(h => 
      h === 'name of shipper' || h.includes('name of shipper') || h.includes('shipper')
    );
    let quantityIndex = headers.findIndex(h => 
      h === 'qtd per bl' || h.includes('qtd per bl') || h.includes('qtd') || h.includes('quantity')
    );
    let brokerIndex = headers.findIndex(h => 
      h === 'customs broker' || h.includes('customs broker') || h.includes('customs') || h.includes('broker')
    );
    
    console.log('Column indices:', { blIndex, shipperIndex, quantityIndex, brokerIndex });
    
    if (blIndex === -1 || shipperIndex === -1 || quantityIndex === -1 || brokerIndex === -1) {
      console.error('Missing columns in pasted data');
      return null;
    }
    
    const entries: SugarEntry[] = [];
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/\t/);
      if (!row || row.length === 0) continue;
      
      const blNumber = String(row[blIndex] || '').trim();
      const shipper = String(row[shipperIndex] || '').trim();
      const quantityRaw = row[quantityIndex];
      const customsBroker = String(row[brokerIndex] || '').trim();
      
      if (!blNumber || !shipper || !customsBroker) continue;
      
      // Parse quantity
      let quantity = parseQuantity(quantityRaw);
      
      entries.push({
        blNumber,
        shipper,
        quantity,
        customsBroker
      });
    }
    
    console.log('Parsed Sugar Entries from paste:', entries);
    
    return { entries };
  } catch (error) {
    console.error('Error parsing pasted data:', error);
    return null;
  }
};

// Parse quantity handling Brazilian and US formats
const parseQuantity = (quantityRaw: any): number => {
  if (typeof quantityRaw === 'number') {
    return quantityRaw;
  }
  
  if (typeof quantityRaw === 'string') {
    // Handle Brazilian number format: 20.000,000 or 20,000.000
    const cleanQty = quantityRaw.replace(/\s/g, '').trim();
    if (cleanQty.includes(',') && cleanQty.includes('.')) {
      // Determine format by position
      const lastDot = cleanQty.lastIndexOf('.');
      const lastComma = cleanQty.lastIndexOf(',');
      if (lastComma > lastDot) {
        // Brazilian format: 20.000,000
        return parseFloat(cleanQty.replace(/\./g, '').replace(',', '.'));
      } else {
        // US format: 20,000.000
        return parseFloat(cleanQty.replace(/,/g, ''));
      }
    } else if (cleanQty.includes(',')) {
      return parseFloat(cleanQty.replace(',', '.'));
    } else {
      return parseFloat(cleanQty);
    }
  }
  
  return 0;
};

export const parseSugarExcel = (file: File): Promise<SugarReciboData | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          resolve(null);
          return;
        }
        
        // Find header row
        const headerRow = jsonData[0] as string[];
        const headers = headerRow.map(h => String(h || '').toLowerCase().trim());
        
        // Find column indices
        const blIndex = headers.findIndex(h => 
          h === 'bl nbr' || h.includes('bl nbr') || h.includes('bl number') || h === 'bl'
        );
        const shipperIndex = headers.findIndex(h => 
          h === 'name of shipper' || h.includes('name of shipper') || h.includes('shipper')
        );
        const quantityIndex = headers.findIndex(h => 
          h === 'qtd per bl' || h.includes('qtd per bl') || h.includes('qtd') || h.includes('quantity')
        );
        const brokerIndex = headers.findIndex(h => 
          h === 'customs broker' || h.includes('customs broker') || h.includes('customs') || h.includes('broker')
        );
        
        console.log('Sugar Excel Headers:', headers);
        console.log('Column indices:', { blIndex, shipperIndex, quantityIndex, brokerIndex });
        
        if (blIndex === -1 || shipperIndex === -1 || quantityIndex === -1 || brokerIndex === -1) {
          console.error('Missing columns in sugar excel');
          resolve(null);
          return;
        }
        
        const entries: SugarEntry[] = [];
        
        // Process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const blNumber = String(row[blIndex] || '').trim();
          const shipper = String(row[shipperIndex] || '').trim();
          const quantityRaw = row[quantityIndex];
          const customsBroker = String(row[brokerIndex] || '').trim();
          
          if (!blNumber || !shipper || !customsBroker) continue;
          
          let quantity = parseQuantity(quantityRaw);
          
          entries.push({
            blNumber,
            shipper,
            quantity,
            customsBroker
          });
        }
        
        console.log('Parsed Sugar Entries:', entries);
        
        resolve({ entries });
      } catch (error) {
        console.error('Error parsing Sugar Excel:', error);
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      resolve(null);
    };
    
    reader.readAsBinaryString(file);
  });
};

// Group entries by customs broker (for sugar)
export const groupByCustomsBroker = (entries: SugarEntry[]): Map<string, SugarEntry[]> => {
  const grouped = new Map<string, SugarEntry[]>();
  
  for (const entry of entries) {
    const existing = grouped.get(entry.customsBroker);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.customsBroker, [entry]);
    }
  }
  
  return grouped;
};
