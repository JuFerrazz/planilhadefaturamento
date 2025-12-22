import * as XLSX from 'xlsx';
import { applyBillingInstruction } from './billingInstructions';

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
  'Observações': string;
  'Não Faturar': boolean;
}

export function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(h => h?.trim());
  const missing = REQUIRED_COLUMNS.filter(col => !normalizedHeaders.includes(col));
  return {
    valid: missing.length === 0,
    missing
  };
}

export function processPastedData(text: string): ProcessingResult {
  try {
    // Split by lines and then by tabs
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, error: 'Dados insuficientes. Cole pelo menos o cabeçalho e uma linha de dados.' };
    }

    // First line is headers
    const headers = lines[0].split('\t').map(h => h.trim());
    
    // Validate columns
    const validation = validateColumns(headers);
    if (!validation.valid) {
      return { 
        success: false, 
        error: 'Colunas obrigatórias não encontradas nos dados colados.',
        missingColumns: validation.missing 
      };
    }

    // Parse data rows
    const jsonData: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row: Record<string, any> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      jsonData.push(row);
    }

    // Group by shipper + broker combination
    const groupedData: Record<string, { blNumbers: string[]; shipper: string; cnpj: string; broker: string }> = {};
    
    jsonData.forEach(row => {
      const shipper = String(row['Name of shipper'] || '').trim();
      const broker = String(row['Customs broker'] || '').trim();
      const blNbr = String(row['BL nbr'] || '').trim();
      const cnpj = String(row['CNPJ/VAT'] || '').trim();
      const key = `${shipper}|${broker}`;
      
      if (shipper) {
        if (!groupedData[key]) {
          groupedData[key] = { blNumbers: [], shipper, cnpj, broker };
        }
        groupedData[key].blNumbers.push(blNbr);
      }
    });

    // Generate output data from grouped records with billing instructions applied
    const outputData: OutputRow[] = Object.values(groupedData).map(group => {
      const qtdBLs = group.blNumbers.length;
      
      // Apply billing instructions
      const billingInfo = applyBillingInstruction(group.shipper, group.cnpj, qtdBLs);
      const valorTotal = billingInfo.valorMultiplier * VALOR_UNITARIO;

      return {
        'BL nbr': group.blNumbers.join('/'),
        'Name of shipper': group.shipper,
        'CNPJ/VAT': billingInfo.cnpj,
        'Qtd BLs': billingInfo.valorMultiplier, // Usa o multiplicador (1 se singleBLFee)
        'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
        'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
        'Customs Broker': group.broker,
        'Contato': billingInfo.contact,
        'Observações': billingInfo.remarks,
        'Não Faturar': billingInfo.skipBilling,
      };
    });

    return { success: true, data: outputData };
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro ao processar os dados colados. Verifique se copiou corretamente do Excel.' 
    };
  }
}

export function generateClipboardData(data: OutputRow[], shipName?: string): { text: string; html: string } {
  // Filtra linhas que NÃO devem ser faturadas
  const billableData = data.filter(row => !row['Não Faturar']);
  const skippedData = data.filter(row => row['Não Faturar']);
  
  const headers = [
    'BL nbr',
    'Name of shipper',
    'CNPJ/VAT',
    'Qtd BLs',
    'Valor unitário',
    'Valor total',
    'Customs Broker',
    'Contato',
    'Observações'
  ];
  
  // Title row with ship name
  const titleText = shipName ? `For BL invoicing '${shipName}'` : '';
  
  // Text format (tab-separated)
  const headerRow = headers.join('\t');
  const dataRows = billableData.map(row => 
    headers.map(h => {
      const val = row[h as keyof OutputRow];
      return typeof val === 'boolean' ? '' : val;
    }).join('\t')
  ).join('\n');
  
  let text = titleText ? `${titleText}\n\n${headerRow}\n${dataRows}` : `${headerRow}\n${dataRows}`;
  
  // Add skipped items note
  if (skippedData.length > 0) {
    const skippedNames = skippedData.map(r => r['Name of shipper']).join(', ');
    text += `\n\n⚠️ NÃO FATURAR: ${skippedNames}`;
  }
  
  // HTML format (table for Excel/Outlook with borders)
  const cellStyle = 'border: 1px solid #000; padding: 4px 8px;';
  const headerStyle = `${cellStyle} background-color: #92D050; font-weight: bold;`;
  const titleStyle = 'font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; margin-bottom: 10px;';
  const warningStyle = 'background-color: #FFCDD2; color: #C62828;';
  
  const htmlHeaderRow = headers.map(h => `<th style="${headerStyle}">${h}</th>`).join('');
  const htmlDataRows = billableData.map((row, idx) => {
    const hasSpecialNote = row['Observações']?.includes('⚠️');
    const rowBg = hasSpecialNote 
      ? 'background-color: #FFF3E0;' 
      : (idx % 2 === 0 ? 'background-color: #fff;' : 'background-color: #f9f9f9;');
    return `<tr>${headers.map(h => {
      const val = row[h as keyof OutputRow];
      const displayVal = typeof val === 'boolean' ? '' : val;
      return `<td style="${cellStyle} ${rowBg}">${displayVal}</td>`;
    }).join('')}</tr>`;
  }).join('');
  
  const titleHtml = shipName ? `<p style="${titleStyle}">For BL invoicing '${shipName}'</p>` : '';
  let html = `${titleHtml}<table style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt;"><thead><tr>${htmlHeaderRow}</tr></thead><tbody>${htmlDataRows}</tbody></table>`;
  
  // Add skipped items warning
  if (skippedData.length > 0) {
    const skippedNames = skippedData.map(r => r['Name of shipper']).join(', ');
    html += `<p style="${warningStyle} padding: 8px; margin-top: 10px; border-radius: 4px;">⚠️ <strong>NÃO FATURAR:</strong> ${skippedNames}</p>`;
  }
  
  return { text, html };
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

        // Group by shipper + broker combination
        const groupedData: Record<string, { blNumbers: string[]; shipper: string; cnpj: string; broker: string }> = {};
        
        jsonData.forEach(row => {
          const shipper = String(row['Name of shipper'] || '').trim();
          const broker = String(row['Customs broker'] || '').trim();
          const blNbr = String(row['BL nbr'] || '').trim();
          const cnpj = String(row['CNPJ/VAT'] || '').trim();
          const key = `${shipper}|${broker}`;
          
          if (shipper) {
            if (!groupedData[key]) {
              groupedData[key] = { blNumbers: [], shipper, cnpj, broker };
            }
            groupedData[key].blNumbers.push(blNbr);
          }
        });
        console.log('Grouped data:', groupedData);

        // Generate output data from grouped records with billing instructions applied
        const outputData: OutputRow[] = Object.values(groupedData).map(group => {
          const qtdBLs = group.blNumbers.length;
          
          // Apply billing instructions
          const billingInfo = applyBillingInstruction(group.shipper, group.cnpj, qtdBLs);
          const valorTotal = billingInfo.valorMultiplier * VALOR_UNITARIO;

          return {
            'BL nbr': group.blNumbers.join('/'),
            'Name of shipper': group.shipper,
            'CNPJ/VAT': billingInfo.cnpj,
            'Qtd BLs': billingInfo.valorMultiplier,
            'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
            'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
            'Customs Broker': group.broker,
            'Contato': billingInfo.contact,
            'Observações': billingInfo.remarks,
            'Não Faturar': billingInfo.skipBilling,
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
  // Separa dados faturáveis dos não faturáveis
  const billableData = data.filter(row => !row['Não Faturar']);
  const skippedData = data.filter(row => row['Não Faturar']);
  
  // Define explicit header order (sem a coluna "Não Faturar" que é interna)
  const headers = [
    'BL nbr',
    'Name of shipper',
    'CNPJ/VAT',
    'Qtd BLs',
    'Valor unitário',
    'Valor total',
    'Customs Broker',
    'Contato',
    'Observações'
  ];

  // Prepara dados removendo a coluna booleana
  const exportData = billableData.map(row => {
    const { 'Não Faturar': _, ...rest } = row;
    return rest;
  });

  // Create worksheet from data with explicit header order
  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 },  // BL nbr
    { wch: 35 },  // Name of shipper
    { wch: 20 },  // CNPJ/VAT
    { wch: 10 },  // Qtd BLs
    { wch: 15 },  // Valor unitário
    { wch: 15 },  // Valor total
    { wch: 25 },  // Customs Broker
    { wch: 30 },  // Contato
    { wch: 50 },  // Observações
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento');
  
  // Se houver itens não faturáveis, adiciona em outra aba
  if (skippedData.length > 0) {
    const skippedExportData = skippedData.map(row => {
      const { 'Não Faturar': _, ...rest } = row;
      return rest;
    });
    const skippedWorksheet = XLSX.utils.json_to_sheet(skippedExportData, { header: headers });
    skippedWorksheet['!cols'] = worksheet['!cols'];
    XLSX.utils.book_append_sheet(workbook, skippedWorksheet, 'Não Faturar');
  }

  // Generate and download
  XLSX.writeFile(workbook, filename);
}
