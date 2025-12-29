export interface BLData {
  id: string;
  // Shipper info
  shipperName: string;
  shipperCnpj: string;
  
  // Vessel info
  vessel: string;
  portOfLoading: string;
  portOfDischarge: string;
  
  // Cargo info
  cargoType: string; // Ex: SOYBEANS MEAL
  duE: string;
  ce: string;
  
  // Weight and value
  grossWeight: number | null; // in metric tons
  
  // Date info
  issueDate: Date | null;
  
  // BL number
  blNumber: string;
}

export interface BLFormProps {
  data: BLData;
  onChange: (data: BLData) => void;
}

export const createEmptyBL = (id: string): BLData => ({
  id,
  shipperName: '',
  shipperCnpj: '',
  vessel: '',
  portOfLoading: 'SANTOS',
  portOfDischarge: '',
  cargoType: '',
  duE: '',
  ce: '',
  grossWeight: null,
  issueDate: null,
  blNumber: '1',
});

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatWeight = (weight: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(weight);
};

export const formatDate = (date: Date): string => {
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${day}${suffix}, ${year}`;
};

const getDaySuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const calculateValue = (grossWeight: number | null): number => {
  if (!grossWeight) return 0;
  return grossWeight * 30;
};

export const getBLStatus = (data: BLData): 'complete' | 'pending' => {
  const requiredFields = [
    data.vessel,
    data.portOfLoading,
    data.shipperName,
    data.shipperCnpj,
    data.cargoType,
    data.grossWeight,
    data.issueDate,
  ];
  
  return requiredFields.every(field => field !== null && field !== '') 
    ? 'complete' 
    : 'pending';
};

export const getPendingFields = (data: BLData): string[] => {
  const pending: string[] = [];
  
  if (!data.vessel) pending.push('Vessel');
  if (!data.portOfLoading) pending.push('Port of Loading');
  if (!data.shipperName) pending.push('Shipper Name');
  if (!data.shipperCnpj) pending.push('Shipper CNPJ');
  if (!data.cargoType) pending.push('Cargo Type');
  if (!data.grossWeight) pending.push('Gross Weight');
  if (!data.issueDate) pending.push('Issue Date');
  if (!data.duE) pending.push('DU-E');
  if (!data.ce) pending.push('CE');
  if (!data.portOfDischarge) pending.push('Port of Discharge');
  
  return pending;
};
