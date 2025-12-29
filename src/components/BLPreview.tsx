import { BLData, formatCurrency, formatWeight, formatDate, calculateValue, getPendingFields } from '@/types/bl';
import { AlertCircle } from 'lucide-react';

interface BLPreviewProps {
  data: BLData;
}

export const BLPreview = ({ data }: BLPreviewProps) => {
  const pendingFields = getPendingFields(data);
  const calculatedValue = calculateValue(data.grossWeight);
  const cargoDescription = data.cargoType 
    ? `BRAZILIAN '${data.cargoType}' PACKING : IN BULK` 
    : 'BRAZILIAN \'[CARGO]\' PACKING : IN BULK';
  
  const issuePlace = `${data.portOfLoading || 'SANTOS'}, BRAZIL`;
  const issueDateFormatted = data.issueDate 
    ? formatDate(data.issueDate)
    : '[DATE PENDING]';

  return (
    <div className="space-y-4">
      {/* Pending Fields Alert */}
      {pendingFields.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Campos Pendentes</p>
            <p className="text-xs text-muted-foreground">
              {pendingFields.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* BL Document */}
      <div 
        id="bl-document" 
        className="bg-white text-black p-4 border-2 border-black print:border-0 print:p-0"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', lineHeight: '1.2' }}
      >
        {/* Header */}
        <div className="border-2 border-black">
          {/* Top row - CODE NAME */}
          <div className="border-b-2 border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>
            CODE NAME: "CONGENBILL" EDITION 1994
          </div>
          
          {/* Main grid */}
          <div className="grid grid-cols-[1fr_auto]">
            {/* Left side - Shipper */}
            <div className="border-r-2 border-black">
              {/* Shipper label */}
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>
                Shipper
              </div>
              {/* Shipper content */}
              <div className="border-b-2 border-black p-2 min-h-[60px]">
                <div className="font-bold">{data.shipperName || '[SHIPPER NAME]'}</div>
                <div>CNPJ {data.shipperCnpj || '[CNPJ]'}</div>
              </div>
              
              {/* Consignee label */}
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>
                Consignee
              </div>
              {/* Consignee content */}
              <div className="border-b-2 border-black p-2 min-h-[50px]">
                <div className="font-bold">TO ORDER</div>
              </div>
              
              {/* Notify address label */}
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>
                Notify address
              </div>
              {/* Notify content */}
              <div className="border-b-2 border-black p-2 min-h-[60px]">
              </div>
            </div>
            
            {/* Right side - BL Info */}
            <div className="w-[200px]">
              <div className="border-b-2 border-black p-1 text-center">
                <div className="font-bold" style={{ fontSize: '11px' }}>BILL OF LADING</div>
                <div style={{ fontSize: '7px' }}>TO BE USED WITH CHARTER-PARTIES</div>
              </div>
              <div className="border-b border-black p-1">
                <div className="font-bold">B/L No. {data.blNumber || '1'}</div>
              </div>
              <div className="border-b-2 border-black p-1">
                <div style={{ fontSize: '8px' }}>Reference No.</div>
              </div>
              <div className="p-2 text-center min-h-[120px] flex items-center justify-center">
                <div className="font-bold tracking-widest" style={{ fontSize: '10px' }}>
                  C O P Y<br />N O T N E G O T I A B L E
                </div>
              </div>
            </div>
          </div>
          
          {/* Vessel and Port of loading row */}
          <div className="grid grid-cols-2 border-t-2 border-black">
            <div className="border-r-2 border-black">
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>Vessel</div>
              <div className="p-1 font-bold">{data.vessel ? `MV ${data.vessel}` : '[VESSEL]'}</div>
            </div>
            <div>
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>Port of loading</div>
              <div className="p-1 font-bold">{data.portOfLoading ? `${data.portOfLoading}, BRAZIL` : '[PORT]'}</div>
            </div>
          </div>
          
          {/* Port of discharge */}
          <div className="border-t-2 border-black">
            <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>Port of discharge</div>
            <div className="p-1 font-bold">{data.portOfDischarge || '[PORT OF DISCHARGE]'}</div>
          </div>
          
          {/* Shipper's description and Gross weight */}
          <div className="grid grid-cols-[1fr_120px] border-t-2 border-black">
            <div className="border-r-2 border-black">
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>Shipper's description of goods</div>
              <div className="p-2 min-h-[120px]">
                <div className="font-bold">{cargoDescription.split("'")[0]}'{data.cargoType || '[CARGO]'}'</div>
                <div className="font-bold">PACKING : IN BULK</div>
                <br />
                {data.duE && <div>DU-E: {data.duE}</div>}
                <br />
                {data.ce && <div>CE: {data.ce}</div>}
              </div>
              <div className="p-1 text-xs italic">
                (of which NIL on deck at Shipper's risk; the Carriers not<br />
                being responsible for loss or damage howsoever arising)
              </div>
            </div>
            <div>
              <div className="border-b border-black p-1" style={{ fontSize: '8px' }}>Gross weight</div>
              <div className="p-2 text-right">
                {data.grossWeight !== null && (
                  <>
                    <div>{Math.round(data.grossWeight / 2).toLocaleString('en-US')}</div>
                    <div className="font-bold">{formatWeight(data.grossWeight)} MT</div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t-2 border-black">
            <div className="grid grid-cols-[1fr_1fr_1fr]">
              {/* Left - Freight info */}
              <div className="border-r-2 border-black p-2">
                <div style={{ fontSize: '8px' }}>Freight payable as per</div>
                <div className="font-bold">CHARTER-PARTY DATED</div>
                <br />
                <div style={{ fontSize: '8px' }}>FREIGHT ADVANCE.</div>
                <div style={{ fontSize: '8px' }}>Received on account of freight:</div>
                <div>…………………………………………</div>
                <br />
                <div style={{ fontSize: '8px' }}>Time used for loading…….days…….hours.</div>
                <br />
                <div className="font-bold">USD {formatCurrency(calculatedValue)}</div>
              </div>
              
              {/* Middle - Freight payable at */}
              <div className="border-r-2 border-black p-2">
                <div style={{ fontSize: '8px' }} className="text-center border-b border-black pb-1">
                  FOR CONDITIONS OF CARRIAGE SEE OVERLEAF
                </div>
                <div className="mt-2">
                  <div style={{ fontSize: '8px' }}>Freight payable at</div>
                </div>
                <div className="mt-2">
                  <div style={{ fontSize: '8px' }}>Number of original Bs/L</div>
                  <div className="font-bold">3 ( THREE)</div>
                </div>
              </div>
              
              {/* Right - Place and signature */}
              <div className="p-2">
                <div style={{ fontSize: '8px' }}>Place and date of issue SHIPPED ON BOARD</div>
                <div className="font-bold">{issuePlace}, {issueDateFormatted}</div>
                <br />
                <div style={{ fontSize: '8px' }}>Signature</div>
                <div className="border-b border-black mt-4 mb-1"></div>
                <div className="font-bold text-center">ROCHAMAR AGENCIA MARITIMA S A</div>
                <div className="text-center" style={{ fontSize: '8px' }}>- AS AGENTS ONLY</div>
                <div className="text-center" style={{ fontSize: '8px' }}>FOR AND ON BEHALF OF THE MASTER</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
