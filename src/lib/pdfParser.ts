export interface ParsedDUEData {
  duE: string;
  shipperCnpj: string;
  shipperName: string;
  grossWeight: number;
}

export const parseDUEPdf = async (file: File): Promise<ParsedDUEData | null> => {
  try {
    const text = await file.text();
    
    // Extract DUE - starts with 25BR, remove hyphens
    const dueMatch = text.match(/25BR\d+[-]?\d*/);
    const duE = dueMatch ? dueMatch[0].replace(/-/g, '') : '';
    
    // Extract Exportadores section - CNPJ followed by company name
    // Format: "04.626.426/0001-06 BTG PACTUAL COMMODITIES SERTRADING S.A."
    const exportadoresMatch = text.match(/Exportadores[^\d]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+([A-Z][A-Z\s\.\-]+(?:S\.?A\.?|LTDA\.?|ME|EPP|EIRELI)?)/i);
    
    let shipperCnpj = '';
    let shipperName = '';
    
    if (exportadoresMatch) {
      shipperCnpj = exportadoresMatch[1];
      shipperName = exportadoresMatch[2].trim().toUpperCase();
    } else {
      // Fallback - try to find CNPJ pattern anywhere followed by company name
      const cnpjMatch = text.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+([A-Z][A-Z\s\.\-]+(?:S\.?A\.?|LTDA\.?|ME|EPP|EIRELI)?)/i);
      if (cnpjMatch) {
        shipperCnpj = cnpjMatch[1];
        shipperName = cnpjMatch[2].trim().toUpperCase();
      }
    }
    
    // Extract Peso Líquido (KG) - format: "30.000.000,00000"
    // Convert from KG to MT (divide by 1000) and format as "30.000,000"
    const pesoMatch = text.match(/Peso\s*l[íi]quido\s*\(KG\)[^\d]*(\d{1,3}(?:\.\d{3})*,\d+)/i);
    let grossWeight = 0;
    
    if (pesoMatch) {
      // Parse the Brazilian number format: 30.000.000,00000
      const pesoStr = pesoMatch[1];
      // Remove dots (thousands separator) and replace comma with dot
      const pesoKg = parseFloat(pesoStr.replace(/\./g, '').replace(',', '.'));
      // Convert KG to MT (divide by 1000)
      grossWeight = pesoKg / 1000;
    }
    
    if (!duE && !shipperCnpj && !grossWeight) {
      return null;
    }
    
    return {
      duE,
      shipperCnpj,
      shipperName,
      grossWeight,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
};
