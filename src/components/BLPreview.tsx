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

  // Format gross weight display
  const grossWeightHalf = data.grossWeight !== null 
    ? (data.grossWeight / 2).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.')
    : '';
  const grossWeightFull = data.grossWeight !== null 
    ? data.grossWeight.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.')
    : '';

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

      {/* BL Document - Full page, no borders */}
      <div 
        id="bl-document" 
        className="bg-white text-blue-800 print:p-0 mx-auto"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '11px', 
          lineHeight: '1.3',
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm',
          color: '#000080'
        }}
      >
        {/* CODE NAME Header */}
        <div style={{ fontSize: '10px', padding: '4px 0', fontWeight: 'bold' }}>
          CODE NAME: "CONGENBILL" EDITION 1994
        </div>

        {/* Row: Shipper | BILL OF LADING | B/L No. */}
        <div style={{ display: 'flex', marginTop: '8px' }}>
          {/* Left: Shipper */}
          <div style={{ width: '50%' }}>
            <div style={{ fontSize: '9px', padding: '2px 0' }}>Shipper</div>
            <div style={{ padding: '4px 0', fontWeight: 'bold', fontSize: '12px' }}>
              {data.shipperName || '[SHIPPER NAME]'}
            </div>
            <div style={{ padding: '2px 0' }}>
              CNPJ {data.shipperCnpj || '[CNPJ]'}
            </div>
          </div>
          {/* Center: BILL OF LADING */}
          <div style={{ width: '30%', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', paddingTop: '8px' }}>
              BILL OF LADING
            </div>
            <div style={{ fontSize: '9px', marginTop: '4px' }}>
              TO BE USED WITH CHARTER-PARTIES
            </div>
          </div>
          {/* Right: B/L No. and Reference */}
          <div style={{ width: '20%' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '4px 0' }}>
              B/L No. {data.blNumber || '1'}
            </div>
            <div style={{ height: '24px' }} />
            <div style={{ fontSize: '9px', padding: '2px 0' }}>Reference No.</div>
          </div>
        </div>

        {/* COPY NOT NEGOTIABLE */}
        <div style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.15em' }}>
          C O P Y&nbsp;&nbsp;N O T&nbsp;&nbsp;N E G O T I A B L E
        </div>

        {/* Consignee */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '9px' }}>Consignee</div>
          <div style={{ height: '16px' }} />
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>TO ORDER</div>
          <div style={{ height: '32px' }} />
        </div>

        {/* Notify address */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '9px' }}>Notify address</div>
          <div style={{ height: '80px' }} />
        </div>

        {/* Vessel | Port of loading */}
        <div style={{ display: 'flex', padding: '8px 0' }}>
          <div style={{ width: '50%' }}>
            <div style={{ fontSize: '9px' }}>Vessel</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>MV {data.vessel || '[VESSEL]'}</div>
            <div style={{ height: '12px' }} />
          </div>
          <div style={{ width: '50%' }}>
            <div style={{ fontSize: '9px' }}>Port of loading</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>{data.portOfLoading ? `${data.portOfLoading}, BRAZIL` : '[PORT], BRAZIL'}</div>
            <div style={{ height: '12px' }} />
          </div>
        </div>

        {/* Port of discharge */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '9px' }}>Port of discharge</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>{data.portOfDischarge || '[PORT OF DISCHARGE]'}</div>
          <div style={{ height: '12px' }} />
        </div>

        {/* Shipper's description of goods | Gross weight */}
        <div style={{ display: 'flex', padding: '8px 0' }}>
          {/* Left: Description */}
          <div style={{ width: '75%' }}>
            <div style={{ fontSize: '9px' }}>Shipper's description of goods</div>
            <div style={{ padding: '8px 0', minHeight: '200px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>BRAZILIAN {data.cargoType || '[CARGO TYPE]'}</div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>PACKING : IN BULK</div>
              <div style={{ height: '16px' }} />
              <div>DU-E: {data.duE || '[DU-E]'}</div>
              <div style={{ height: '12px' }} />
              <div>CE: {data.ce || '[CE]'}</div>
              <div style={{ height: '100px' }} />
              <div style={{ fontSize: '10px', fontStyle: 'italic', paddingLeft: '24px' }}>
                (of which&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NIL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on deck at Shipper's risk; the Carriers not
              </div>
              <div style={{ fontSize: '10px', fontStyle: 'italic', paddingLeft: '24px' }}>
                being responsible for loss or damage howsoever arising)
              </div>
            </div>
          </div>
          {/* Right: Gross weight */}
          <div style={{ width: '25%' }}>
            <div style={{ fontSize: '9px' }}>Gross weight</div>
            <div style={{ padding: '8px 0', textAlign: 'right' }}>
              <div style={{ height: '24px' }} />
              {data.grossWeight !== null ? (
                <>
                  <div style={{ fontSize: '12px' }}>{grossWeightHalf}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{grossWeightFull}&nbsp;&nbsp;MT</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '12px' }}>[WEIGHT]</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>[WEIGHT]&nbsp;&nbsp;MT</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - 2 main columns */}
        <div style={{ display: 'flex', padding: '8px 0' }}>
          {/* Left Column - Freight info */}
          <div style={{ width: '30%', paddingRight: '16px' }}>
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>Freight payable as per</div>
            <div style={{ fontStyle: 'italic', fontSize: '11px' }}>CHARTER-PARTY DATED</div>
            <div style={{ height: '32px' }} />
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>FREIGHT ADVANCE.</div>
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>Received on account of freight:</div>
            <div style={{ height: '24px' }} />
            <div style={{ height: '24px' }} />
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>Time used for loading............ ....days.... .............hours.</div>
            <div style={{ height: '24px' }} />
            <div style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '12px' }}>
              USD {formatCurrency(calculatedValue)}
            </div>
          </div>

          {/* Right Side - Contains SHIPPED text */}
          <div style={{ width: '70%' }}>
            {/* SHIPPED text section */}
            <div style={{ padding: '4px 0', fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>SHIPPED</span>&nbsp;&nbsp;at&nbsp;&nbsp;the&nbsp;&nbsp;Port&nbsp;&nbsp;of&nbsp;&nbsp;Loading&nbsp;&nbsp;in&nbsp;&nbsp;apparent&nbsp;&nbsp;&nbsp;&nbsp;good
            </div>
            <div style={{ padding: '0', fontSize: '10px', paddingLeft: '48px' }}>
              order&nbsp;&nbsp;&nbsp;and&nbsp;&nbsp;&nbsp;condition&nbsp;&nbsp;&nbsp;on&nbsp;&nbsp;board&nbsp;&nbsp;the&nbsp;&nbsp;Vessel
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              for carriage&nbsp;&nbsp;to&nbsp;&nbsp;the&nbsp;&nbsp;Port of Discharge or so near thereto
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              as&nbsp;&nbsp;&nbsp;she&nbsp;&nbsp;may&nbsp;&nbsp;safely&nbsp;&nbsp;get&nbsp;&nbsp;&nbsp;the&nbsp;&nbsp;&nbsp;goods&nbsp;&nbsp;specified&nbsp;&nbsp;above.
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              Weight,&nbsp;&nbsp;measure,&nbsp;&nbsp;quality,&nbsp;&nbsp;quantity,&nbsp;&nbsp;condition,&nbsp;&nbsp;contents
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              and value unknown.
            </div>
            <div style={{ padding: '4px 0', fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>IN WITNESS</span>&nbsp;&nbsp;whereof the&nbsp;&nbsp;Master&nbsp;&nbsp;or&nbsp;&nbsp;Agent&nbsp;&nbsp;of&nbsp;&nbsp;the&nbsp;&nbsp;said
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              Vessel has signed the number of Bills of Lading indicated
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              below all of this tenor and&nbsp;&nbsp;date,&nbsp;&nbsp;any&nbsp;&nbsp;one&nbsp;&nbsp;of which being
            </div>
            <div style={{ padding: '0', fontSize: '10px' }}>
              accomplished the others shall be void.
            </div>
            <div style={{ height: '24px' }} />
          </div>
        </div>

        {/* FOR CONDITIONS line */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px', padding: '8px 0' }}>
          FOR CONDITIONS OF CARRIAGE SEE OVERLEAF
        </div>

        {/* Bottom sub-sections - 3 columns */}
        <div style={{ display: 'flex', padding: '8px 0' }}>
          <div style={{ width: '30%', paddingRight: '16px' }}>
            <div style={{ fontSize: '9px' }}>Freight payable at</div>
            <div style={{ height: '20px' }} />
            <div style={{ paddingTop: '8px' }}>
              <div style={{ fontSize: '9px' }}>Number of original Bs/L</div>
              <div style={{ height: '12px' }} />
              <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>3 ( THREE)</div>
            </div>
          </div>
          <div style={{ width: '35%', paddingRight: '16px' }}>
            <div style={{ fontSize: '9px' }}>Place and date of issue <span style={{ fontStyle: 'italic' }}>SHIPPED ON BOARD</span></div>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>{issuePlace}, BRAZIL, {issueDateFormatted}</div>
            <div style={{ marginTop: '12px', paddingTop: '8px' }}>
              <div style={{ fontSize: '9px' }}>Signature</div>
            </div>
          </div>
          <div style={{ width: '35%' }}>
            <div style={{ height: '32px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '10px', fontStyle: 'italic' }}>ROCHAMAR AGENCIA MARITIMA S A</div>
            <div style={{ height: '8px' }} />
            <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold' }}>-&nbsp;&nbsp;AS AGENTS ONLY</div>
            <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold' }}>FOR AND ON BEHALF OF THE MASTER</div>
          </div>
        </div>
      </div>
    </div>
  );
};
