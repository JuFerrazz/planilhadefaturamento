import { useRef, forwardRef } from 'react';
import agriPortLogo from '@/assets/agri-port-logo.png';

interface GrainReciboProps {
  date: string;
  vessel: string;
  cargo: 'SBS' | 'SBM' | 'CORN';
  port: string;
  shipper: string;
  blNumbers: string[];
  quantity: number;
}

const cargoNames: Record<string, string> = {
  'SBS': 'SBS',
  'SBM': 'SBM',
  'CORN': 'CORN'
};

export const GrainRecibo = forwardRef<HTMLDivElement, GrainReciboProps>(({
  date,
  vessel,
  cargo,
  port,
  shipper,
  blNumbers,
  quantity
}, ref) => {
  // Format BL numbers: "1 E 2" or "1, 3 E 9"
  const formatBlNumbers = (numbers: string[]) => {
    if (numbers.length === 1) return numbers[0];
    if (numbers.length === 2) return `${numbers[0]} E ${numbers[1]}`;
    const last = numbers[numbers.length - 1];
    const rest = numbers.slice(0, -1);
    return `${rest.join(', ')} E ${last}`;
  };

  // Format quantity with comma as decimal separator
  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('en-US', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    }) + ' MT';
  };

  return (
    <div 
      ref={ref}
      className="bg-white p-6 max-w-[210mm] mx-auto min-h-screen flex flex-col justify-between"
      style={{ 
        fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
        fontSize: '10pt',
        lineHeight: '1.4'
      }}
    >
      <div className="flex-1">
        {/* Header with logo */}
        <div className="flex justify-between items-start mb-6">
          <img 
            src={agriPortLogo} 
            alt="Agri Port Services Brasil" 
            className="h-16 object-contain"
          />
          <div className="text-right text-[12pt] font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
            DATA: {date}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold my-8">RECIBO</h1>

        {/* Main text */}
        <p className="mb-8 text-justify text-[12pt] leading-relaxed">
          Recebi de ROCHAMAR AGÊNCIA MARÍTIMA S.A., 1ª/2ª/3ª vias Originais e 5 cópias não negociáveis, 
          dos Bs/L abaixo relacionados, referente ao <span className="font-bold">MV {vessel} – {cargoNames[cargo]}</span>, com embarque no 
          porto de <span className="font-bold">{port}</span>.
        </p>

        {/* Table */}
        <table className="w-full border-collapse mb-12" style={{ fontFamily: 'Arial, sans-serif' }}>
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-3 font-bold text-[10pt]">B/L nbr</th>
              <th className="text-left py-3 font-bold text-[10pt]">SHIPPER</th>
              <th className="text-right py-3 font-bold text-[10pt]">QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-3 text-[10pt]">{formatBlNumbers(blNumbers)}</td>
              <td className="py-3 text-[10pt]">{shipper}</td>
              <td className="py-3 text-right text-[10pt]">{formatQuantity(quantity)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature section */}
      <div className="space-y-6 text-[10pt]">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <span>Empresa: </span>
            <span className="inline-block border-b border-black w-96"></span>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <span>Data: </span>
              <span className="inline-block border-b border-black w-12"></span>
              <span>/</span>
              <span className="inline-block border-b border-black w-12"></span>
              <span>/</span>
              <span className="inline-block border-b border-black w-20"></span>
            </div>
            <div>
              <span>Horário: </span>
              <span className="inline-block border-b border-black w-12"></span>
              <span>:</span>
              <span className="inline-block border-b border-black w-12"></span>
            </div>
          </div>
          
          <div>
            <span>RG: </span>
            <span className="inline-block border-b border-black w-96"></span>
          </div>
          
          <div>
            <span>Nome: </span>
            <span className="inline-block border-b border-black w-96"></span>
          </div>
          
          <div className="mt-6">
            <span>Assinatura: </span>
            <span className="inline-block border-b border-black w-96"></span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-[9pt] text-gray-600">
          <p>Av. Ana Costa, nº 433, 9º and., cjs. 91/91/95/96</p>
          <p>Edifício Parque Ana Costa</p>
          <p>Tel: 13-3328 9500</p>
          <p>www.rochamar.com</p>
        </div>
      </div>
    </div>
  );
});

GrainRecibo.displayName = 'GrainRecibo';
