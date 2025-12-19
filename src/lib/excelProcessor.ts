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
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          resolve({ success: false, error: 'A planilha está vazia ou não contém dados suficientes.' });
          return;
        }

        // Get headers (first row)
        const headers = jsonData[0] as string[];
        
        // Validate columns
        const validation = validateColumns(headers);
        if (!validation.valid) {
          resolve({ 
            success: false, 
            error: 'Colunas obrigatórias não encontradas na planilha.',
            missingColumns: validation.missing 
          });
          return;
        }

        // Get column indices
        const colIndex = {
          nameOfShipper: headers.indexOf('Name of shipper'),
          blNbr: headers.indexOf('BL nbr'),
          cnpjVat: headers.indexOf('CNPJ/VAT'),
          customsBroker: headers.indexOf('Customs broker')
        };

        // Process data rows (skip header)
        const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

        // Count occurrences of each Name of shipper
        const shipperCounts: Record<string, number> = {};
        dataRows.forEach(row => {
          const shipper = String(row[colIndex.nameOfShipper] || '').trim();
          if (shipper) {
            shipperCounts[shipper] = (shipperCounts[shipper] || 0) + 1;
          }
        });

        // Generate output data
        const outputData: OutputRow[] = dataRows.map(row => {
          const shipper = String(row[colIndex.nameOfShipper] || '').trim();
          const qtdBLs = shipperCounts[shipper] || 1;
          const valorTotal = qtdBLs * VALOR_UNITARIO;

          return {
            'BL nbr': String(row[colIndex.blNbr] || '').trim(),
            'Name of shipper': shipper,
            'CNPJ/VAT': String(row[colIndex.cnpjVat] || '').trim(),
            'Qtd BLs': qtdBLs,
            'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
            'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
            'Customs Broker': String(row[colIndex.customsBroker] || '').trim(),
            'Contato': ''
          };
        });

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
