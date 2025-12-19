import * as XLSX from 'xlsx';

// Expected column names from input file
const REQUIRED_COLUMNS = [
  'Name of shipper',
  'Qtd per BL',
  'BL nbr',
  'Qtd per DU-E',
  'CNPJ/VAT',
  'DU-E',
  'Customs broker'
];

// Fixed unit value
const VALOR_UNITARIO = 300;

export interface ProcessingResult {
  success: boolean;
  data?: any[];
  error?: string;
  missingColumns?: string[];
}

export interface OutputRow {
  'BL nbr': string;
  'Name of shipper': string;
  'CNPJ/VAT': string;
  'Qtd BLs': number;
  'Valor unitário': string;
  'Valor total': string;
  'Customs Broker': string;
  'Contato': string;
}

export function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(h => h?.trim());
  const missing = REQUIRED_COLUMNS.filter(col => !normalizedHeaders.includes(col));
  return {
    valid: missing.length === 0,
    missing
  };
}

export function processExcelFile(file: File): Promise<ProcessingResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON as objects (using first row as headers)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
        
        console.log('Raw data first row:', rawData[0]);
        
        if (rawData.length === 0) {
          resolve({ success: false, error: 'A planilha está vazia ou não contém dados suficientes.' });
          return;
        }

        // Normalize the data by trimming column names and values
        const jsonData = rawData.map(row => {
          const normalizedRow: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            const normalizedKey = key.trim();
            normalizedRow[normalizedKey] = row[key];
          }
          return normalizedRow;
        });

        // Get headers from the first row's keys (already normalized)
        const headers = Object.keys(jsonData[0]);
        console.log('Normalized headers:', headers);
        
        // Validate columns
        const validation = validateColumns(headers);
        if (!validation.valid) {
          console.log('Missing columns:', validation.missing);
          resolve({ 
            success: false, 
            error: 'Colunas obrigatórias não encontradas na planilha.',
            missingColumns: validation.missing 
          });
          return;
        }

        console.log('Data rows count:', jsonData.length);
        console.log('First normalized row:', jsonData[0]);

        // Count occurrences of each Name of shipper
        const shipperCounts: Record<string, number> = {};
        jsonData.forEach(row => {
          const shipper = String(row['Name of shipper'] || '').trim();
          if (shipper) {
            shipperCounts[shipper] = (shipperCounts[shipper] || 0) + 1;
          }
        });
        console.log('Shipper counts:', shipperCounts);

        // Generate output data
        const outputData: OutputRow[] = jsonData.map(row => {
          const shipper = String(row['Name of shipper'] || '').trim();
          const qtdBLs = shipperCounts[shipper] || 1;
          const valorTotal = qtdBLs * VALOR_UNITARIO;

          return {
            'BL nbr': String(row['BL nbr'] || '').trim(),
            'Name of shipper': shipper,
            'CNPJ/VAT': String(row['CNPJ/VAT'] || '').trim(),
            'Qtd BLs': qtdBLs,
            'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
            'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
            'Customs Broker': String(row['Customs broker'] || '').trim(),
            'Contato': ''
          };
        });

        console.log('Output data:', outputData);
        resolve({ success: true, data: outputData });
      } catch (error) {
        resolve({ 
          success: false, 
          error: 'Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.' 
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Erro ao ler o arquivo.' });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function generateExcelDownload(data: OutputRow[], filename: string = 'planilha_base.xlsx'): void {
  // Define explicit header order
  const headers = [
    'BL nbr',
    'Name of shipper',
    'CNPJ/VAT',
    'Qtd BLs',
    'Valor unitário',
    'Valor total',
    'Customs Broker',
    'Contato'
  ];

  // Create worksheet from data with explicit header order
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 },  // BL nbr
    { wch: 35 },  // Name of shipper
    { wch: 20 },  // CNPJ/VAT
    { wch: 10 },  // Qtd BLs
    { wch: 15 },  // Valor unitário
    { wch: 15 },  // Valor total
    { wch: 25 },  // Customs Broker
    { wch: 20 },  // Contato
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha Base');

  // Generate and download
  XLSX.writeFile(workbook, filename);
}
