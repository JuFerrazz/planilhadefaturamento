// Instruções de faturamento para cada shipper
// Baseado na planilha LISTA_DE_FATURAMENTO_AÇÚCAR_-_APS.xlsx

export interface BillingInstruction {
  shipper: string;
  aliases?: string[]; // Nomes alternativos que podem aparecer
  email?: string;
  remarks?: string;
  skipBilling?: boolean; // NÃO FATURAR
  singleBLFee?: boolean; // Cobrar apenas 1 taxa de BL
  overrideCNPJ?: string; // CNPJ alternativo para faturar
  overrideCompanyName?: string; // Nome da empresa alternativa
  additionalEmails?: string[]; // Emails adicionais para copiar
  specialNote?: string; // Nota especial (ex: cor vermelha)
}

export const BILLING_INSTRUCTIONS: BillingInstruction[] = [
  {
    shipper: 'CZARNIKOW',
    email: 'financeiro@czarnikow.com',
    remarks: 'Exportador paga somente 1 taxa de BL. Enviar cobrança direto para eles e não para os despachantes.',
    singleBLFee: true,
  },
  {
    shipper: 'DELTA SUCROENERGIA S.A',
    aliases: ['DELTA SUCROENERGIA', 'DELTA'],
    remarks: 'Centralizar TODAS AS COBRANÇAS DA DELTA NO CNPJ: 13.537.735/0003-62',
    overrideCNPJ: '13.537.735/0003-62',
  },
  {
    shipper: 'NUTRADE COMERCIAL EXPORTADORA LTDA',
    aliases: ['NUTRADE'],
    email: 'exportacao.granel@raxbrasil.com.br',
    remarks: 'Faturar RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA - 17.343.028/0001-24',
    overrideCNPJ: '17.343.028/0001-24',
    overrideCompanyName: 'RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA',
  },
  {
    shipper: 'RAIZEN ENERGIA',
    aliases: ['RAIZEN ARARAQUARA', 'RAIZEN PARAGUAÇU LTDA', 'RAIZEN CENTRO SUL', 'RAIZEN CENTRO SUL PAULISTA'],
    email: 'exportacao.granel@raxbrasil.com.br',
    remarks: 'Faturar sempre para RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA - 17.343.028/0001-24',
    overrideCNPJ: '17.343.028/0001-24',
    overrideCompanyName: 'RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA',
  },
  {
    shipper: 'RAIZEN CAARAPO ACUCAR E ALCOOL LTDA',
    aliases: ['RAIZEN CAARAPO'],
    email: 'exportacao.granel@raxbrasil.com.br',
    remarks: 'Faturar sempre para RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA - 17.343.028/0001-24',
    overrideCNPJ: '17.343.028/0001-24',
    overrideCompanyName: 'RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA',
  },
  {
    shipper: 'SUCDEN',
    email: 'nfserv@sucden.com.br',
    additionalEmails: ['rtalarini@sucden.com', 'exeraw.br@sucden.com', 'exelog@sucden.com'],
    remarks: 'Copiar Rose e execução: Rosemeire Talarini <rtalarini@sucden.com.br> / 11 5501-1405 / 11 98187-1405',
  },
  {
    shipper: 'USINA CONQUISTA DO PONTAL',
    aliases: ['USINA CONQUISTA DO PONTAL (ATVOS)', 'ATVOS', 'USINA ELDORADO'],
    email: 'exportacao.granel@raxbrasil.com.br',
    remarks: 'Faturar RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA - 17.343.028/0001-24',
    overrideCNPJ: '17.343.028/0001-24',
    overrideCompanyName: 'RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA',
  },
  {
    shipper: 'USINA ELDORADO',
    email: 'exportacao.granel@raxbrasil.com.br',
    remarks: 'Faturar RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA - 17.343.028/0001-24',
    overrideCNPJ: '17.343.028/0001-24',
    overrideCompanyName: 'RAX BRASIL ASSESSORIA EM COMERCIO EXTERIOR LTDA',
  },
  {
    shipper: 'USINAS ITAJOBI',
    aliases: ['ITAJOBI'],
    remarks: 'Faturar sempre para JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA - 19.562.559/0001-33',
    overrideCNPJ: '19.562.559/0001-33',
    overrideCompanyName: 'JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA',
  },
  {
    shipper: 'COFCO',
    remarks: 'Faturar JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA - 19.562.559/0001-33',
    overrideCNPJ: '19.562.559/0001-33',
    overrideCompanyName: 'JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA',
  },
  {
    shipper: 'CLEALCO',
    remarks: 'Faturar JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA - 19.562.559/0001-33',
    overrideCNPJ: '19.562.559/0001-33',
    overrideCompanyName: 'JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA',
  },
  {
    shipper: 'COLOMBO',
    remarks: 'NÃO FAZ MAIS PELO CNPJ DA JRD',
  },
  {
    shipper: 'ENGELHART',
    remarks: 'NÃO FATURAR!',
    skipBilling: true,
  },
  {
    shipper: 'TEREOS ACUCAR E ENERGIA BRASIL S.A.',
    aliases: ['TEREOS', 'TEREOS ACUCAR E ENERGIA BRASIL'],
    remarks: 'PERGUNTAR SEMPRE O CNPJ QUE DEVERÁ SER UTILIZADO PARA A JRD',
    specialNote: 'Verificar CNPJ com JRD',
  },
  {
    shipper: 'BOM SUCESSO',
    remarks: 'AO ENVIAR POR E-MAIL AO ACCOUNT SEMPRE DEIXAR A COR EM VERMELHO PARA QUE ELES LEMBREM DE PREENCHER O FORMULARIO SOLICITADO.',
    specialNote: '⚠️ DESTACAR EM VERMELHO',
  },
  {
    shipper: 'CERRADINHO',
    remarks: 'AO ENVIAR POR E-MAIL AO ACCOUNT SEMPRE DEIXAR A COR EM VERMELHO. DEAG - Enviar cobrança direto para eles e não para os despachantes.',
    specialNote: '⚠️ DESTACAR EM VERMELHO',
  },
  {
    shipper: 'CANAPOLIS',
    aliases: ['VALE DO TIJUCO', 'VALE DO PONTAL'],
    email: 'bruno.scanavini@cmaa.ind.br',
    remarks: 'DEAG - Enviar cobrança direto para eles e não para os despachantes.',
    specialNote: '⚠️ DESTACAR EM VERMELHO',
  },
  {
    shipper: 'BRANCO PERES AGRO S/A',
    aliases: ['BRANCO PERES'],
    additionalEmails: ['angelobozzo@brancoperes.com.br', 'leonardofernandes@brancoperes.com.br'],
    remarks: 'Adicionar emails: angelobozzo@brancoperes.com.br; leonardofernandes@brancoperes.com.br na mensagem',
  },
  {
    shipper: 'USINA AÇUCAREIRA SANTA TEREZINHA',
    aliases: ['SANTA TEREZINHA', 'USINA SANTA TEREZINHA'],
    remarks: 'NÃO FATURAR, ESTE EXPORTADOR NÃO PAGA BL FEE.',
    skipBilling: true,
  },
  {
    shipper: 'REVATI SA',
    aliases: ['REVATI'],
    remarks: 'Faturar sempre para JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA - 19.562.559/0001-33',
    overrideCNPJ: '19.562.559/0001-33',
    overrideCompanyName: 'JRD ASSESSORIA ADUANEIRA E TRANSPORTES LTDA',
  },
  {
    shipper: 'BTG PACTUAL COMMODITIES SERTRADING S.A.',
    aliases: ['BTG PACTUAL', 'BTG', 'SERTRADING'],
    remarks: 'NÃO FATURAR, ESTE EXPORTADOR NÃO PAGA BL FEE. (04.626.426/0001-06)',
    skipBilling: true,
  },
];

// Função para buscar instrução por nome do shipper
export function findBillingInstruction(shipperName: string): BillingInstruction | undefined {
  const normalizedName = shipperName.toUpperCase().trim();
  
  return BILLING_INSTRUCTIONS.find(instruction => {
    // Verifica o nome principal
    if (normalizedName.includes(instruction.shipper.toUpperCase())) {
      return true;
    }
    // Verifica se o shipper contém o nome da instrução
    if (instruction.shipper.toUpperCase().includes(normalizedName)) {
      return true;
    }
    // Verifica aliases
    if (instruction.aliases) {
      return instruction.aliases.some(alias => 
        normalizedName.includes(alias.toUpperCase()) || 
        alias.toUpperCase().includes(normalizedName)
      );
    }
    return false;
  });
}

// Função para aplicar instruções a uma linha de saída
export function applyBillingInstruction(
  shipper: string,
  originalCNPJ: string,
  qtdBLs: number
): {
  cnpj: string;
  contact: string;
  skipBilling: boolean;
  valorMultiplier: number;
  companyName?: string;
  cnpjAlterado: boolean;
  destacar: boolean;
} {
  const instruction = findBillingInstruction(shipper);
  
  if (!instruction) {
    return {
      cnpj: originalCNPJ,
      contact: '',
      skipBilling: false,
      valorMultiplier: qtdBLs,
      cnpjAlterado: false,
      destacar: false,
    };
  }

  // Monta o contato
  let contact = instruction.email || '';
  if (instruction.additionalEmails && instruction.additionalEmails.length > 0) {
    if (contact) {
      contact += '; ' + instruction.additionalEmails.join('; ');
    } else {
      contact = instruction.additionalEmails.join('; ');
    }
  }

  // Verifica se CNPJ foi alterado
  const cnpjAlterado = !!instruction.overrideCNPJ;
  
  // Verifica se deve destacar (specialNote com vermelho)
  const destacar = instruction.specialNote?.includes('VERMELHO') || false;

  return {
    cnpj: instruction.overrideCNPJ || originalCNPJ,
    contact,
    skipBilling: instruction.skipBilling || false,
    valorMultiplier: instruction.singleBLFee ? 1 : qtdBLs,
    companyName: instruction.overrideCompanyName,
    cnpjAlterado,
    destacar,
  };
}
