import * as XLSX from 'xlsx';
import { applyBillingInstruction } from './billingInstructions';
import { findDespachanteEmail } from './despachantesEmails';

// Expected column names from input file
const REQUIRED_COLUMNS = [
  'Name of shipper',
  'Qtd per BL',
  'BL nbr',
  'Qtd per DU-E', // Aceita tanto DU-E quanto DUE
  'CNPJ/VAT',
  'DU-E', // Aceita tanto DU-E quanto DUE
  'Customs broker'
];

// Função para normalizar nomes de colunas (aceita DUE e DU-E)
const normalizeColumnName = (columnName: string): string => {
  const normalized = columnName.trim();
  // Converte "DUE" para "DU-E" para padronizar
  if (normalized === 'Qtd per DUE') return 'Qtd per DU-E';
  if (normalized === 'DUE') return 'DU-E';
  return normalized;
};

// Fixed unit value
const VALOR_UNITARIO = 350;

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
  'Não Faturar': boolean;
  // Flags de estilo
  '_cnpjAlterado': boolean;
  '_destacar': boolean;
  '_shipperVermelho': boolean; // Nome do shipper em vermelho
  '_valorZerado': boolean; // Valor total zerado
}

// Ordem fixa das colunas quando não há cabeçalho
const COLUMN_ORDER = [
  'Name of shipper',
  'Qtd per BL',
  'BL nbr',
  'Qtd per DU-E',
  'CNPJ/VAT',
  'DU-E',
  'Customs broker'
];

export function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(h => normalizeColumnName(h?.trim()));
  const missing = REQUIRED_COLUMNS.filter(col => !normalizedHeaders.includes(col));
  return {
    valid: missing.length === 0,
    missing
  };
}

// Verifica se a primeira linha parece ser um cabeçalho
function isHeaderRow(values: string[]): boolean {
  const normalizedValues = values.map(v => normalizeColumnName(v?.trim() || ''));
  // Se pelo menos 3 colunas reconhecidas, é cabeçalho
  const matchedColumns = REQUIRED_COLUMNS.filter(col => normalizedValues.includes(col));
  return matchedColumns.length >= 3;
}

export function processPastedData(text: string): ProcessingResult {
  try {
    // Split by lines and then by tabs
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) {
      return { success: false, error: 'Dados insuficientes. Cole pelo menos uma linha de dados.' };
    }

    // Check if first line is a header row
    const firstLineValues = lines[0].split('\t').map(h => h.trim());
    const hasHeader = isHeaderRow(firstLineValues);
    
    let headers: string[];
    let dataStartIndex: number;
    
    if (hasHeader) {
      // First line is headers - normalize them
      headers = firstLineValues.map(h => normalizeColumnName(h));
      dataStartIndex = 1;
    } else {
      // No header - use fixed column order
      headers = COLUMN_ORDER;
      dataStartIndex = 0;
    }

    if (lines.length <= dataStartIndex) {
      return { success: false, error: 'Dados insuficientes. Cole pelo menos uma linha de dados.' };
    }

    // Parse data rows using headers
    const jsonData: Record<string, any>[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
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
      // Se valorZerado, o total é 0
      const valorTotal = billingInfo.valorZerado ? 0 : billingInfo.valorMultiplier * VALOR_UNITARIO;

      return {
        'BL nbr': group.blNumbers.join('/'),
        'Name of shipper': group.shipper,
        'CNPJ/VAT': billingInfo.cnpj,
        'Qtd BLs': qtdBLs, // Quantidade real de BLs
        'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
        'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
        'Customs Broker': group.broker,
        'Contato': billingInfo.contact,
        'Não Faturar': billingInfo.skipBilling,
        '_cnpjAlterado': billingInfo.cnpjAlterado,
        '_destacar': billingInfo.destacar,
        '_shipperVermelho': billingInfo.shipperVermelho,
        '_valorZerado': billingInfo.valorZerado,
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
    'Contato'
  ];
  
  // Title row with ship name
  const titleText = shipName ? `For BL invoicing '${shipName}'` : '';
  
  // Calcular totais para texto
  const totalBLsText = billableData.reduce((acc, row) => acc + (row['Qtd BLs'] || 0), 0);
  const totalValorText = billableData.reduce((acc, row) => {
    const valorStr = row['Valor total'].replace('R$ ', '').replace('.', '').replace(',', '.');
    return acc + parseFloat(valorStr);
  }, 0);
  
  // Text format (tab-separated)
  const headerRow = headers.join('\t');
  const dataRows = billableData.map(row => 
    headers.map(h => {
      const val = row[h as keyof OutputRow];
      return typeof val === 'boolean' ? '' : val;
    }).join('\t')
  ).join('\n');
  
  // Linha de total em texto
  const totalRow = `\t TOTAL\t\t${totalBLsText}\t\tR$ ${totalValorText.toFixed(2).replace('.', ',')}\t\t`;
  
  let text = titleText ? `${titleText}\n\n${headerRow}\n${dataRows}\n${totalRow}` : `${headerRow}\n${dataRows}\n${totalRow}`;
  
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
  // Estilos para CNPJ alterado (negrito + vermelho)
  const cnpjAlteradoStyle = 'font-weight: bold; color: #C62828;';
  // Estilos para linha destacada (fonte vermelha ao invés de fundo amarelo)
  const highlightTextStyle = 'color: #C62828;';
  // Estilo para shipper em vermelho (preencher formulário)
  const shipperVermelhoStyle = 'font-weight: bold; color: #C62828;';
  // Estilo para valor zerado (vermelho)
  const valorZeradoStyle = 'font-weight: bold; color: #C62828;';
  
  // Calcular totais
  const totalBLs = billableData.reduce((acc, row) => acc + (row['Qtd BLs'] || 0), 0);
  const totalValor = billableData.reduce((acc, row) => {
    const valorStr = row['Valor total'].replace('R$ ', '').replace('.', '').replace(',', '.');
    return acc + parseFloat(valorStr);
  }, 0);
  
  const htmlHeaderRow = headers.map(h => `<th style="${headerStyle}">${h}</th>`).join('');
  const htmlDataRows = billableData.map((row, idx) => {
    const rowBg = idx % 2 === 0 ? 'background-color: #fff;' : 'background-color: #f9f9f9;';
    // Se deve destacar, aplica fonte vermelha em toda a linha
    const rowTextStyle = row['_destacar'] ? highlightTextStyle : '';
    
    return `<tr>${headers.map(h => {
      const val = row[h as keyof OutputRow];
      const displayVal = typeof val === 'boolean' ? '' : val;
      
      // Se é coluna CNPJ e foi alterado, aplica estilo vermelho/negrito
      if (h === 'CNPJ/VAT' && row['_cnpjAlterado']) {
        return `<td style="${cellStyle} ${rowBg} ${cnpjAlteradoStyle}">${displayVal}</td>`;
      }
      
      // Se é coluna Name of shipper e deve ser vermelho (preencher formulário)
      if (h === 'Name of shipper' && row['_shipperVermelho']) {
        return `<td style="${cellStyle} ${rowBg} ${shipperVermelhoStyle}">${displayVal}</td>`;
      }
      
      // Se é coluna Valor total e valor zerado (não paga BL fee)
      if (h === 'Valor total' && row['_valorZerado']) {
        return `<td style="${cellStyle} ${rowBg} ${valorZeradoStyle}">${displayVal}</td>`;
      }
      
      // Se linha destacada, aplica fonte vermelha
      if (rowTextStyle) {
        return `<td style="${cellStyle} ${rowBg} ${rowTextStyle}">${displayVal}</td>`;
      }
      
      return `<td style="${cellStyle} ${rowBg}">${displayVal}</td>`;
    }).join('')}</tr>`;
  }).join('');
  
  // Linha de totais
  const totalRowStyle = 'background-color: #D9EAD3; font-weight: bold;';
  const htmlTotalRow = `<tr>
    <td style="${cellStyle} ${totalRowStyle}"></td>
    <td style="${cellStyle} ${totalRowStyle}">TOTAL</td>
    <td style="${cellStyle} ${totalRowStyle}"></td>
    <td style="${cellStyle} ${totalRowStyle}">${totalBLs}</td>
    <td style="${cellStyle} ${totalRowStyle}"></td>
    <td style="${cellStyle} ${totalRowStyle}">R$ ${totalValor.toFixed(2).replace('.', ',')}</td>
    <td style="${cellStyle} ${totalRowStyle}"></td>
    <td style="${cellStyle} ${totalRowStyle}"></td>
  </tr>`;
  
  const titleHtml = shipName ? `<p style="${titleStyle}">For BL invoicing '${shipName}'</p>` : '';
  let html = `${titleHtml}<table style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt;"><thead><tr>${htmlHeaderRow}</tr></thead><tbody>${htmlDataRows}${htmlTotalRow}</tbody></table>`;
  
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
        
        // Convert to array of arrays first to check for header
        const rawArrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (rawArrayData.length === 0) {
          resolve({ success: false, error: 'A planilha está vazia ou não contém dados suficientes.' });
          return;
        }

        // Check if first row is a header
        const firstRow = rawArrayData[0].map(v => String(v || '').trim());
        const hasHeader = isHeaderRow(firstRow);
        
        let headers: string[];
        let dataRows: any[][];
        
        if (hasHeader) {
          headers = firstRow.map(h => normalizeColumnName(h));
          dataRows = rawArrayData.slice(1);
        } else {
          headers = COLUMN_ORDER;
          dataRows = rawArrayData;
        }

        console.log('Has header:', hasHeader);
        console.log('Headers:', headers);

        if (dataRows.length === 0) {
          resolve({ success: false, error: 'A planilha não contém dados suficientes.' });
          return;
        }

        // Convert to array of objects using headers
        const jsonData = dataRows.map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] !== undefined ? String(row[idx]).trim() : '';
          });
          return obj;
        });

        console.log('Data rows count:', jsonData.length);
        console.log('First row:', jsonData[0]);

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
          // Se valorZerado, o total é 0
          const valorTotal = billingInfo.valorZerado ? 0 : billingInfo.valorMultiplier * VALOR_UNITARIO;

          return {
            'BL nbr': group.blNumbers.join('/'),
            'Name of shipper': group.shipper,
            'CNPJ/VAT': billingInfo.cnpj,
            'Qtd BLs': qtdBLs, // Quantidade real de BLs
            'Valor unitário': `R$ ${VALOR_UNITARIO.toFixed(2).replace('.', ',')}`,
            'Valor total': `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
            'Customs Broker': group.broker,
            'Contato': billingInfo.contact,
            'Não Faturar': billingInfo.skipBilling,
            '_cnpjAlterado': billingInfo.cnpjAlterado,
            '_destacar': billingInfo.destacar,
            '_shipperVermelho': billingInfo.shipperVermelho,
            '_valorZerado': billingInfo.valorZerado,
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
  
  // Define explicit header order (sem colunas internas)
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

  // Prepara dados removendo colunas internas
  const exportData = billableData.map(row => {
    const { 'Não Faturar': _, '_cnpjAlterado': __, '_destacar': ___, '_shipperVermelho': ____, '_valorZerado': _____, ...rest } = row;
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
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento');
  
  // Se houver itens não faturáveis, adiciona em outra aba
  if (skippedData.length > 0) {
    const skippedExportData = skippedData.map(row => {
      const { 'Não Faturar': _, '_cnpjAlterado': __, '_destacar': ___, '_shipperVermelho': ____, '_valorZerado': _____, ...rest } = row;
      return rest;
    });
    const skippedWorksheet = XLSX.utils.json_to_sheet(skippedExportData, { header: headers });
    skippedWorksheet['!cols'] = worksheet['!cols'];
    XLSX.utils.book_append_sheet(workbook, skippedWorksheet, 'Não Faturar');
  }

  // Generate and download
  XLSX.writeFile(workbook, filename);
}
