export interface ReciboBLEntry {
  blNumber: string;
  shipper: string;
  quantity: number;
}

export interface ReciboData {
  date: string;
  vessel: string;
  cargo: 'SBS' | 'SBM' | 'CORN' | 'SUGAR';
  port: string;
  entries: ReciboBLEntry[];
}

export interface GroupedRecibo {
  groupKey: string; // shipper (grãos) ou customs broker (açúcar)
  blNumbers: string[];
  shipper: string;
  totalQuantity: number;
  individualEntries?: ReciboBLEntry[]; // para açúcar onde não soma
}

export interface CargoManifestData {
  vessel: string;
  port: string;
  entries: ReciboBLEntry[];
}
