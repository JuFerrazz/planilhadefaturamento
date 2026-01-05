// Mapeamento de despachantes para emails
export const DESPACHANTES_EMAILS: Record<string, string> = {
  'ABENI': 'exportacao@abenigroup.com; lbechelli@abenigroup.com',
  'ADM': 'ststa@adm.com',
  'AFR SERVIÇOS': 'export@afrservicos.com.br; caroline.couto@afrservicos.com.br',
  'AFR SERVICOS': 'export@afrservicos.com.br; caroline.couto@afrservicos.com.br',
  'ALP LOGISTICA ADUANEIRA LTDA': 'allan@alplog.com.br; junior@alplog.com.br; exec@alplog.com.br',
  'ALP LOGISTICA': 'allan@alplog.com.br; junior@alplog.com.br; exec@alplog.com.br',
  'ALP': 'allan@alplog.com.br; junior@alplog.com.br; exec@alplog.com.br',
  'ANTONIO SERGIO': 'export@antosergio.com.br',
  'AUXILIAR': 'exportacao@auxiliarsantos.com.br; victor@auxiliarsantos.com.br',
  'BUNGE STS': 'bbr.execution.santos@bunge.com; bbr.execution.agri@bunge.com; bga.execution.sam@bunge.com; bbr.execution.support@bunge.com',
  'FERTIMPORT': 'bbr.execution.santos@bunge.com; bbr.execution.agri@bunge.com; bga.execution.sam@bunge.com; bbr.execution.support@bunge.com',
  'BUNGE': 'bbr.execution.santos@bunge.com; bbr.execution.agri@bunge.com; bga.execution.sam@bunge.com; bbr.execution.support@bunge.com',
  'CARAMURU': 'despachosts@caramuru.com',
  'CARGILL': 'desemb-gosc@Cargill.com; docs-gosc@Cargill.com',
  'CARMOS': 'exportacao.sts@carmos.com.br',
  'COOPERSUCAR': 'tnoliveira@copersucar.com.br; CCOProgramacao@copersucar.com.br; Pfborba@copersucar.com.br; te.documents.brazil@alvean.com; Leandro.Alvares@alvean.com',
  'CROMOSERV': 'sugar@cromoserv.com; daniela.freitas@cromoserv.com',
  'CUTRALE': 'gabriela.somenci@cutrale.com.br; Allan@cutrale.com.br; execution@cutraletrading.com',
  'DEAG': 'execution@deag.com.br',
  'FLIPPER': 'sugar@grupoflipper.com.br; exportacao1@grupoflipper.com.br; exportacao@grupoflipper.com.br',
  'GRUPO FLIPPER': 'sugar@grupoflipper.com.br; exportacao1@grupoflipper.com.br; exportacao@grupoflipper.com.br',
  'ITAMARATY': 'despacho@itamaratylogistica.com.br',
  'JRD COMEX': 'thayse.gomes@jrdcomex.com.br; joseroberto@jrdcomex.com.br; granel@jrdcomex.com.br',
  'JRD': 'thayse.gomes@jrdcomex.com.br; joseroberto@jrdcomex.com.br; granel@jrdcomex.com.br',
  'LOTUS DESPACHOS': 'tavyny@lotusaduaneira.com.br; wagner@lotusaduaneira.com.br; tiago@lotusaduaneira.com.br',
  'LOTUS': 'tavyny@lotusaduaneira.com.br; wagner@lotusaduaneira.com.br; tiago@lotusaduaneira.com.br',
  'LOUIS DREYFUS': 'spo-ldcbra-aduana@ldc.com; BZL-BULKSHIPMENTS@ldc.com',
  'LDC': 'spo-ldcbra-aduana@ldc.com; BZL-BULKSHIPMENTS@ldc.com',
  'LPC': 'ie.maritimo@lpc.com.br',
  'MARELLE': 'despachos@marelleservicos.com.br',
  'MULTIMODAL': 'dener.multimodal@mmodal.com.br; export.multimodal@mmodal.com.br',
  'NIHIL': 'rtalarini@sucden.com.br; exeraw.br@sucden.com; exelog@sucden.com.br',
  'NOSSO PORTO': 'nossoporto@nossoporto.com.br; documentos@nossoporto.com.br; financeiro@nossoport.com.br',
  'PIBERNAT': 'rafael.lopes@pibernat.com.br; katia.costa@pibernat.com.br; john.lima@pibernat.com.br',
  'PORTO': 'op@portoaduaneira.com.br',
  'RAX': 'exportacao.granel@raxbrasil.com.br',
  'RBS': 'granel.docs@rbslogistics.com.br',
  'S & RIBEIRO SERVICOS': 'andre@sribeiroassessoria.com.br',
  'S & RIBEIRO': 'andre@sribeiroassessoria.com.br',
  'RIBEIRO': 'andre@sribeiroassessoria.com.br',
  'SENIOR': 'senior@senior-comex.com.br; gabriel.silva@senior-comex.com.br',
  'SUCDEN DO BRASIL': 'rtalarini@sucden.com; exeraw@sucden.com',
  'SUCDEN': 'rtalarini@sucden.com; exeraw@sucden.com',
  'SUNRISE SERVICOS ADUANEIROS LTDA': 'exec.granel@sunriseonline.com.br; export@copersucar.com.br',
  'SUNRISE': 'exec.granel@sunriseonline.com.br; export@copersucar.com.br',
  'T-GRAO': 'assist.despacho@tgrao.com.br',
  'TGRAO': 'assist.despacho@tgrao.com.br',
  'WNIG': 'werter@wnig.com.br; export@wnig.com.br',
  'INDAIA': 'atendimentocargill@myindaia.com.br; wagner.teixeira@myindaia.com.br',
};

// Função para buscar email do despachante
export function findDespachanteEmail(despachanteName: string): string {
  if (!despachanteName) return '';
  
  const normalizedName = despachanteName.toUpperCase().trim();
  
  // Busca exata primeiro
  if (DESPACHANTES_EMAILS[normalizedName]) {
    return DESPACHANTES_EMAILS[normalizedName];
  }
  
  // Busca por palavras-chave
  for (const [key, email] of Object.entries(DESPACHANTES_EMAILS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return email;
    }
  }
  
  // Busca por partes do nome
  const nameWords = normalizedName.split(/\s+/);
  for (const [key, email] of Object.entries(DESPACHANTES_EMAILS)) {
    const keyWords = key.split(/\s+/);
    const hasMatch = nameWords.some(word => 
      keyWords.some(keyWord => 
        word.length > 2 && keyWord.includes(word)
      )
    );
    if (hasMatch) {
      return email;
    }
  }
  
  return '';
}