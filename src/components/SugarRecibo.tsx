import { forwardRef } from 'react';
import agriPortLogo from '@/assets/agri-port-logo.png';
import { SugarEntry } from '@/lib/sugarReciboParser';

interface SugarReciboProps {
  date: string;
  vessel: string;
  port: string;
  customsBroker: string;
  entries: SugarEntry[];
}

export const SugarRecibo = forwardRef<HTMLDivElement, SugarReciboProps>(({
  date,
  vessel,
  port,
  customsBroker,
  entries
}, ref) => {
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
      className="bg-white p-8 max-w-[210mm] mx-auto min-h-screen flex flex-col justify-between"
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
          <div className="text-right text-[12pt] font-bold">
            DATA: {date}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold my-8">RECIBO</h1>

        {/* Main text */}
        <p className="mb-12 text-justify text-[14pt] leading-relaxed">
          Recebi de ROCHAMAR AGÊNCIA MARÍTIMA S.A., 1ª/2ª/3ª vias Originais e 5 cópias não negociáveis, 
          dos Bs/L abaixo relacionados, referente ao MV {vessel} – SUGAR, com embarque no 
          porto de {port}.
        </p>

        {/* Table - each entry separate, no summing */}
        <table className="w-full border-collapse mb-16">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-4 font-bold text-[14pt]">B/L nbr</th>
              <th className="text-left py-4 font-bold text-[14pt]">SHIPPER</th>
              <th className="text-right py-4 font-bold text-[14pt]">QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-4 text-[12pt]">{entry.blNumber}</td>
                <td className="py-4 text-[12pt]">{entry.shipper}</td>
                <td className="py-4 text-right text-[12pt]">{formatQuantity(entry.quantity)}</td>
              </tr>
            ))}
            {/* Custom Broker row */}
            <tr className="border-t-2 border-black">
              <td className="py-4 font-bold text-[12pt]" colSpan={2}>DESPACHANTE:</td>
              <td className="py-4 text-right font-bold text-[12pt]">{customsBroker}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature section */}
      <div className="space-y-8 text-[12pt]">
        <div className="grid grid-cols-1 gap-6">
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
          
          <div className="mt-8">
            <span>Assinatura: </span>
            <span className="inline-block border-b border-black w-96"></span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-[11pt] text-gray-600">
          <p>Av. Ana Costa, nº 433, 9º and., cjs. 91/91/95/96</p>
          <p>Edifício Parque Ana Costa</p>
          <p>Tel: 13-3328 9500</p>
          <p>www.rochamar.com</p>
        </div>
      </div>
    </div>
  );
});

SugarRecibo.displayName = 'SugarRecibo';
