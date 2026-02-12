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

// Ordem fixa das colunas quando não há cabeçalho (mesma da planilha de faturamento)
const SUGAR_COLUMN_ORDER = ['Name of shipper', 'Qtd per BL', 'BL nbr', 'Qtd per DU-E', 'CNPJ/VAT', 'DU-E', 'Customs broker'];

// Verifica se a primeira linha parece ser um cabeçalho
function isSugarHeaderRow(values: string[]): boolean {
  const knownHeaders = ['name of shipper', 'qtd per bl', 'bl nbr', 'customs broker', 'cnpj/vat', 'du-e', 'due', 'qtd per du-e', 'qtd per due'];
  const matched = values.filter(v => knownHeaders.includes(v.toLowerCase().trim()));
  return matched.length >= 3;
}

// Parse pasted text data (tab-separated) - supports with or without header
export const parsePastedData = (text: string): SugarReciboData | null => {
  try {
    console.log('Sugar Parser - Raw text received:', text.substring(0, 200));
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 1) {
      console.log('Sugar Parser - Not enough lines:', lines.length);
      return null;
    }
    
    const firstLineValues = lines[0].split(/\t/).map(h => h.trim());
    const hasHeader = isSugarHeaderRow(firstLineValues);
    
    let blIndex: number;
    let shipperIndex: number;
    let quantityIndex: number;
    let brokerIndex: number;
    let dataStartIndex: number;
    
    if (hasHeader) {
      const headers = firstLineValues.map(h => h.toLowerCase().trim());
      console.log('Sugar Parser - Headers found:', headers);
      
      blIndex = headers.findIndex(h => 
        h === 'bl nbr' || h.includes('bl nbr') || h.includes('bl number') || h === 'bl'
      );
      shipperIndex = headers.findIndex(h => 
        h === 'name of shipper' || h.includes('name of shipper') || h.includes('shipper')
      );
      quantityIndex = headers.findIndex(h => 
        h === 'qtd per bl' || h.includes('qtd per bl') || h.includes('qtd') || h.includes('quantity')
      );
      brokerIndex = headers.findIndex(h => 
        h === 'customs broker' || h.includes('customs broker') || h.includes('customs') || h.includes('broker')
      );
      dataStartIndex = 1;
      
      if (blIndex === -1 || shipperIndex === -1 || quantityIndex === -1 || brokerIndex === -1) {
        console.error('Sugar Parser - Missing required columns');
        return null;
      }
    } else {
      // Sem cabeçalho: usa ordem fixa (Name of shipper=0, Qtd per BL=1, BL nbr=2, ..., Customs broker=6)
      console.log('Sugar Parser - No header detected, using fixed column order');
      shipperIndex = 0;
      quantityIndex = 1;
      blIndex = 2;
      brokerIndex = 6;
      dataStartIndex = 0;
    }
    
    console.log('Sugar Parser - Column indices:', { blIndex, shipperIndex, quantityIndex, brokerIndex, hasHeader });
    
    const entries: SugarEntry[] = [];
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      const row = lines[i].split(/\t/);
      if (!row || row.length === 0) continue;
      
      const blNumber = String(row[blIndex] || '').trim();
      const shipper = String(row[shipperIndex] || '').trim();
      const quantityRaw = row[quantityIndex];
      const customsBroker = String(row[brokerIndex] || '').trim();
      
      if (!blNumber || !shipper || !customsBroker) continue;
      
      let quantity = parseQuantity(quantityRaw);
      
      entries.push({ blNumber, shipper, quantity, customsBroker });
    }
    
    console.log('Sugar Parser - Final parsed entries:', entries);
    
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
