import { BLData, formatCurrency, formatWeight, formatDate, calculateValue, getPendingFields } from '@/types/bl';
import { AlertCircle } from 'lucide-react';

interface BLPreviewProps {
  data: BLData;
}

export const BLPreview = ({ data }: BLPreviewProps) => {
  const pendingFields = getPendingFields(data);
  const calculatedValue = calculateValue(data.grossWeight);
  
  const issuePlace = data.portOfLoading || 'SANTOS';
  const issueDateFormatted = data.issueDate 
    ? formatDate(data.issueDate)
    : 'DECEMBER XXth, 2025';

  // Format gross weight display - first line is half value, second is full with MT
  const grossWeightHalf = data.grossWeight !== null ? Math.round(data.grossWeight / 2).toLocaleString('en-US').replace(/,/g, ',') : '';
  const grossWeightFull = data.grossWeight !== null ? formatWeight(data.grossWeight) : '';

  return (
    <div className="space-y-4">
      {/* Pending Fields Alert */}
      {pendingFields.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-2 print:hidden">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Campos Pendentes</p>
            <p className="text-xs text-muted-foreground">
              {pendingFields.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* BL Document - Exact replica of CONGENBILL */}
      <div 
        id="bl-document" 
        className="bg-white text-black print:border-0 print:p-0 mx-auto"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '10px', 
          lineHeight: '1.3',
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm'
        }}
      >
        {/* Main Table Structure */}
        <table className="w-full border-collapse" style={{ border: '2px solid black' }}>
          <tbody>
            {/* Row 1: CODE NAME Header */}
            <tr>
              <td 
                colSpan={9} 
                className="text-center font-bold border-b-2 border-black p-1"
                style={{ fontSize: '11px' }}
              >
                CODE NAME: "CONGENBILL" EDITION 1994
              </td>
            </tr>

            {/* Row 2: Shipper Label + BILL OF LADING + B/L No. */}
            <tr>
              <td 
                rowSpan={5} 
                className="border-r-2 border-black align-top"
                style={{ width: '55%' }}
              >
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Shipper</div>
                <div className="p-2">
                  <div className="font-bold">{data.shipperName || '[SHIPPER NAME]'}</div>
                  <div>CNPJ {data.shipperCnpj || '[CNPJ]'}</div>
                </div>
              </td>
              <td 
                colSpan={7} 
                className="border-b border-black text-center font-bold p-1"
                style={{ fontSize: '12px' }}
              >
                BILL OF LADING
              </td>
              <td 
                className="border-l-2 border-b border-black p-1 font-bold"
                style={{ width: '15%' }}
              >
                B/L No. {data.blNumber || '1'}
              </td>
            </tr>

            {/* Row 3: TO BE USED WITH CHARTER-PARTIES */}
            <tr>
              <td 
                colSpan={7} 
                className="border-b-2 border-black text-center p-1"
                style={{ fontSize: '9px' }}
              >
                TO BE USED WITH CHARTER-PARTIES
              </td>
              <td className="border-l-2 border-b-2 border-black" />
            </tr>

            {/* Row 4: Reference No. */}
            <tr>
              <td colSpan={7} className="border-b border-black p-1" style={{ fontSize: '8px' }}>
                Reference No.
              </td>
              <td className="border-l-2 border-b border-black" />
            </tr>

            {/* Row 5: Empty + COPY NOT NEGOTIABLE */}
            <tr>
              <td colSpan={8} className="text-center p-4 align-middle" style={{ minHeight: '80px' }}>
                <div className="font-bold tracking-[0.3em]" style={{ fontSize: '11px' }}>
                  C O P Y&nbsp;&nbsp;&nbsp;N O T&nbsp;&nbsp;&nbsp;N E G O T I A B L E
                </div>
              </td>
            </tr>

            {/* Consignee Section */}
            <tr>
              <td 
                rowSpan={3} 
                className="border-r-2 border-t-2 border-black align-top"
              >
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Consignee</div>
                <div className="p-2" style={{ minHeight: '60px' }}>
                  <div className="font-bold">TO ORDER</div>
                </div>
              </td>
              <td colSpan={8} className="border-t-2 border-black" style={{ height: '0px' }} />
            </tr>
            <tr>
              <td colSpan={8} />
            </tr>
            <tr>
              <td colSpan={8} />
            </tr>

            {/* Notify address Section */}
            <tr>
              <td 
                rowSpan={4} 
                className="border-r-2 border-t-2 border-black align-top"
              >
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Notify address</div>
                <div className="p-2" style={{ minHeight: '80px' }}>
                  {/* Empty - no notify address in template */}
                </div>
              </td>
              <td colSpan={8} className="border-t-2 border-black" style={{ height: '0px' }} />
            </tr>
            <tr><td colSpan={8} /></tr>
            <tr><td colSpan={8} /></tr>
            <tr><td colSpan={8} /></tr>

            {/* Vessel and Port of loading row */}
            <tr>
              <td className="border-t-2 border-r-2 border-black align-top" style={{ width: '27.5%' }}>
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Vessel</div>
                <div className="p-1 font-bold">MV {data.vessel || '[VESSEL]'}</div>
              </td>
              <td colSpan={8} className="border-t-2 border-black align-top">
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Port of loading</div>
                <div className="p-1 font-bold">{data.portOfLoading ? `${data.portOfLoading}, BRAZIL` : '[PORT], BRAZIL'}</div>
              </td>
            </tr>

            {/* Port of discharge */}
            <tr>
              <td colSpan={9} className="border-t-2 border-black align-top">
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Port of discharge</div>
                <div className="p-1 font-bold">{data.portOfDischarge || '[PORT OF DISCHARGE]'}</div>
              </td>
            </tr>

            {/* Shipper's description of goods and Gross weight */}
            <tr>
              <td className="border-t-2 border-r-2 border-black align-top" style={{ width: '75%' }} colSpan={7}>
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Shipper's description of goods</div>
                <div className="p-2" style={{ minHeight: '180px' }}>
                  <div className="font-bold">BRAZILIAN {data.cargoType || '[CARGO TYPE]'}</div>
                  <div className="font-bold">PACKING : IN BULK</div>
                  <br />
                  <div>DU-E: {data.duE || '[DU-E]'}</div>
                  <br />
                  <div>CE: {data.ce || '[CE]'}</div>
                </div>
                <div className="p-1" style={{ fontSize: '8px' }}>
                  <div className="italic">
                    (of which NIL on deck at Shipper's risk; the Carriers not
                  </div>
                  <div className="italic pl-1">
                    being responsible for loss or damage howsoever arising)
                  </div>
                </div>
              </td>
              <td colSpan={2} className="border-t-2 border-black align-top">
                <div className="p-1" style={{ fontSize: '8px', borderBottom: '1px solid black' }}>Gross weight</div>
                <div className="p-2 text-right">
                  {data.grossWeight !== null ? (
                    <>
                      <div>{grossWeightHalf}</div>
                      <div className="font-bold">{grossWeightFull}<span className="ml-1">MT</span></div>
                    </>
                  ) : (
                    <>
                      <div>[WEIGHT]</div>
                      <div className="font-bold">[WEIGHT] MT</div>
                    </>
                  )}
                </div>
              </td>
            </tr>

            {/* Bottom Section - 3 columns */}
            <tr>
              {/* Left Column - Freight info */}
              <td className="border-t-2 border-r-2 border-black align-top p-2" colSpan={3}>
                <div style={{ fontSize: '8px' }}>Freight payable as per</div>
                <div className="font-bold">CHARTER-PARTY DATED</div>
                <br />
                <br />
                <div style={{ fontSize: '8px' }}>FREIGHT ADVANCE.</div>
                <div style={{ fontSize: '8px' }}>Received on account of freight:</div>
                <br />
                <div>…………………………………………………………………….…………</div>
                <br />
                <div style={{ fontSize: '8px' }}>Time used for loading…………. ….days…. ..……….hours.</div>
              </td>

              {/* Middle Column */}
              <td className="border-t-2 border-r-2 border-black align-top" colSpan={3}>
                <div 
                  className="text-center font-bold p-1" 
                  style={{ fontSize: '9px', borderBottom: '1px solid black' }}
                >
                  FOR CONDITIONS OF CARRIAGE SEE OVERLEAF
                </div>
                <div className="p-2">
                  <div style={{ fontSize: '8px' }}>Freight payable at</div>
                  <br />
                  <br />
                  <div style={{ fontSize: '8px' }}>Number of original Bs/L</div>
                  <div className="font-bold">3 ( THREE)</div>
                </div>
              </td>

              {/* Right Column - Place and signature */}
              <td className="border-t-2 border-black align-top p-2" colSpan={3}>
                <div style={{ fontSize: '8px' }}>Place and date of issue SHIPPED ON BOARD</div>
                <div className="font-bold">{issuePlace}, BRAZIL, {issueDateFormatted}</div>
                <br />
                <div style={{ fontSize: '8px' }}>Signature</div>
                <div className="mt-6 border-b border-black" style={{ width: '90%' }}></div>
                <div className="font-bold mt-1">ROCHAMAR AGENCIA MARITIMA S A</div>
                <div style={{ fontSize: '8px' }}>- AS AGENTS ONLY</div>
                <div style={{ fontSize: '8px' }}>FOR AND ON BEHALF OF THE MASTER</div>
              </td>
            </tr>

            {/* Value Row */}
            <tr>
              <td className="border-t-2 border-black p-2 font-bold" colSpan={3}>
                USD {formatCurrency(calculatedValue)}
              </td>
              <td colSpan={6} className="border-t-2 border-black" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
