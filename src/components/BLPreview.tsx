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
    <div className="space-y-4 print:space-y-0 print:w-full print:h-full">
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
        className="bg-white text-blue-800 border border-border rounded-lg print:border-0 print:rounded-none print:p-0 print:m-0 print:w-full print:max-w-none print:h-full mx-auto"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '10px', 
          lineHeight: '1.2',
          width: '210mm',
          minHeight: '297mm',
          padding: '8mm',
          color: '#000080'
        }}
      >
        {/* Main container with outer border */}
        <div style={{ border: '2px solid #000080' }}>
          
          {/* CODE NAME Header */}
          <div style={{ fontSize: '9px', padding: '2px 4px', fontWeight: 'bold' }}>
            CODE NAME: "CONGENBILL" EDITION 1994
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Row: Shipper | BILL OF LADING | B/L No. */}
          <div style={{ display: 'flex' }}>
            {/* Left: Shipper */}
            <div style={{ width: '50%' }}>
              <div style={{ fontSize: '8px', padding: '1px 4px' }}>Shipper</div>
              <div style={{ padding: '2px 4px', fontWeight: 'bold' }}>
                {data.shipperName || '[SHIPPER NAME]'}
              </div>
              <div style={{ padding: '2px 4px' }}>
                CNPJ {data.shipperCnpj || '[CNPJ]'}
              </div>
            </div>
            {/* Center: BILL OF LADING */}
            <div style={{ width: '30%', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', paddingTop: '4px' }}>
                BILL OF LADING
              </div>
              <div style={{ fontSize: '8px' }}>
                TO BE USED WITH CHARTER-PARTIES
              </div>
            </div>
            {/* Right: B/L No. and Reference */}
            <div style={{ width: '20%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', padding: '2px 4px' }}>
                B/L No. {data.blNumber || '1'}
              </div>
              <div style={{ height: '20px' }} />
              <div style={{ fontSize: '8px', padding: '2px 4px' }}>Reference No.</div>
            </div>
          </div>

          {/* COPY NOT NEGOTIABLE */}
          <div style={{ textAlign: 'right', padding: '4px 20px', fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.15em' }}>
            C O P Y&nbsp;&nbsp;N O T&nbsp;&nbsp;N E G O T I A B L E
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Consignee */}
          <div style={{ padding: '2px 4px' }}>
            <div style={{ fontSize: '8px' }}>Consignee</div>
            <div style={{ height: '12px' }} />
            <div style={{ fontWeight: 'bold' }}>TO ORDER</div>
            <div style={{ height: '24px' }} />
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Notify address */}
          <div style={{ padding: '2px 4px' }}>
            <div style={{ fontSize: '8px' }}>Notify address</div>
            <div style={{ height: '60px' }} />
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Vessel | Port of loading */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', padding: '2px 4px' }}>
              <div style={{ fontSize: '8px' }}>Vessel</div>
              <div style={{ fontWeight: 'bold' }}>MV {data.vessel || '[VESSEL]'}</div>
              <div style={{ height: '8px' }} />
            </div>
            <div style={{ width: '50%', padding: '2px 4px' }}>
              <div style={{ fontSize: '8px' }}>Port of loading</div>
              <div style={{ fontWeight: 'bold' }}>{data.portOfLoading ? `${data.portOfLoading}, BRAZIL` : '[PORT], BRAZIL'}</div>
              <div style={{ height: '8px' }} />
            </div>
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Port of discharge */}
          <div style={{ padding: '2px 4px' }}>
            <div style={{ fontSize: '8px' }}>Port of discharge</div>
            <div style={{ fontWeight: 'bold' }}>{data.portOfDischarge || '[PORT OF DISCHARGE]'}</div>
            <div style={{ height: '8px' }} />
          </div>

          {/* HORIZONTAL LINE - FULL width */}
          <div style={{ borderBottom: '2px solid #000080', width: '100%' }} />

          {/* Shipper's description of goods | Gross weight */}
          <div style={{ display: 'flex' }}>
            {/* Left: Description */}
            <div style={{ width: '75%', borderRight: '2px solid #000080' }}>
              <div style={{ fontSize: '8px', padding: '2px 4px' }}>Shipper's description of goods</div>
              <div style={{ padding: '4px 20px', minHeight: '180px' }}>
                <div style={{ fontWeight: 'bold' }}>BRAZILIAN {data.cargoType || '[CARGO TYPE]'}</div>
                <div style={{ fontWeight: 'bold' }}>PACKING : IN BULK</div>
                <div style={{ height: '12px' }} />
                <div>DU-E: {data.duE || '[DU-E]'}</div>
                <div style={{ height: '8px' }} />
                <div>CE: {data.ce || '[CE]'}</div>
                <div style={{ height: '80px' }} />
                <div style={{ fontSize: '9px', fontStyle: 'italic', paddingLeft: '20px' }}>
                  (of which&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NIL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on deck at Shipper's risk; the Carriers not
                </div>
                <div style={{ fontSize: '9px', fontStyle: 'italic', paddingLeft: '20px' }}>
                  being responsible for loss or damage howsoever arising)
                </div>
              </div>
            </div>
            {/* Right: Gross weight */}
            <div style={{ width: '25%' }}>
              <div style={{ fontSize: '8px', padding: '2px 4px' }}>Gross weight</div>
              <div style={{ padding: '4px 8px', textAlign: 'right' }}>
                <div style={{ height: '20px' }} />
                {data.grossWeight !== null ? (
                  <>
                    <div>{grossWeightHalf}</div>
                    <div style={{ fontWeight: 'bold' }}>{grossWeightFull}&nbsp;&nbsp;MT</div>
                  </>
                ) : (
                  <>
                    <div>[WEIGHT]</div>
                    <div style={{ fontWeight: 'bold' }}>[WEIGHT]&nbsp;&nbsp;MT</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* HORIZONTAL LINE - FULL width */}
          <div style={{ borderBottom: '2px solid #000080', width: '100%' }} />

          {/* Bottom Section - 2 main columns */}
          <div style={{ display: 'flex' }}>
            {/* Left Column - Freight info */}
            <div style={{ width: '30%', borderRight: '2px solid #000080', padding: '4px' }}>
              <div style={{ fontSize: '8px', fontStyle: 'italic' }}>Freight payable as per</div>
              <div style={{ fontStyle: 'italic' }}>CHARTER-PARTY DATED</div>
              <div style={{ height: '24px' }} />
              <div style={{ fontSize: '8px', fontStyle: 'italic' }}>FREIGHT ADVANCE.</div>
              <div style={{ fontSize: '8px', fontStyle: 'italic' }}>Received on account of freight:</div>
              <div style={{ height: '16px' }} />
              <div style={{ borderBottom: '1px solid #000080', width: '90%', marginBottom: '8px' }} />
              <div style={{ height: '16px' }} />
              <div style={{ fontSize: '8px', fontStyle: 'italic' }}>Time used for loading............ ....days.... .............hours.</div>
              <div style={{ height: '16px', borderBottom: '2px solid #000080' }} />
              <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                USD {formatCurrency(calculatedValue)}
              </div>
            </div>

            {/* Right Side - Contains SHIPPED text and sub-sections */}
            <div style={{ width: '70%' }}>
              {/* SHIPPED text section */}
              <div style={{ padding: '4px', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold' }}>SHIPPED</span>&nbsp;&nbsp;at&nbsp;&nbsp;the&nbsp;&nbsp;Port&nbsp;&nbsp;of&nbsp;&nbsp;Loading&nbsp;&nbsp;in&nbsp;&nbsp;apparent&nbsp;&nbsp;&nbsp;&nbsp;good
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px', paddingLeft: '40px' }}>
                order&nbsp;&nbsp;&nbsp;and&nbsp;&nbsp;&nbsp;condition&nbsp;&nbsp;&nbsp;on&nbsp;&nbsp;board&nbsp;&nbsp;the&nbsp;&nbsp;Vessel
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                for carriage&nbsp;&nbsp;to&nbsp;&nbsp;the&nbsp;&nbsp;Port of Discharge or so near thereto
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                as&nbsp;&nbsp;&nbsp;she&nbsp;&nbsp;may&nbsp;&nbsp;safely&nbsp;&nbsp;get&nbsp;&nbsp;&nbsp;the&nbsp;&nbsp;&nbsp;goods&nbsp;&nbsp;specified&nbsp;&nbsp;above.
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                Weight,&nbsp;&nbsp;measure,&nbsp;&nbsp;quality,&nbsp;&nbsp;quantity,&nbsp;&nbsp;condition,&nbsp;&nbsp;contents
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                and value unknown.
              </div>
              <div style={{ padding: '4px', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold' }}>IN WITNESS</span>&nbsp;&nbsp;whereof the&nbsp;&nbsp;Master&nbsp;&nbsp;or&nbsp;&nbsp;Agent&nbsp;&nbsp;of&nbsp;&nbsp;the&nbsp;&nbsp;said
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                Vessel has signed the number of Bills of Lading indicated
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                below all of this tenor and&nbsp;&nbsp;date,&nbsp;&nbsp;any&nbsp;&nbsp;one&nbsp;&nbsp;of which being
              </div>
              <div style={{ padding: '0 4px', fontSize: '9px' }}>
                accomplished the others shall be void.
              </div>
              
              {/* FOR CONDITIONS line */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px', borderTop: '1px solid #000080', borderBottom: '1px solid #000080', padding: '4px', marginTop: '8px' }}>
                FOR CONDITIONS OF CARRIAGE SEE OVERLEAF
              </div>

              {/* Bottom sub-sections - 2 columns */}
              <div style={{ display: 'flex' }}>
                <div style={{ width: '40%', borderRight: '1px solid #000080', padding: '4px' }}>
                  <div style={{ fontSize: '8px' }}>Freight payable at</div>
                  <div style={{ height: '16px' }} />
                  <div style={{ borderTop: '1px solid #000080', paddingTop: '4px' }}>
                    <div style={{ fontSize: '8px' }}>Number of original Bs/L</div>
                    <div style={{ height: '8px' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>3 ( THREE)</div>
                  </div>
                </div>
                <div style={{ width: '60%', padding: '4px' }}>
                  <div style={{ fontSize: '8px' }}>Place and date of issue <span style={{ fontStyle: 'italic' }}>SHIPPED ON BOARD</span></div>
                  <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{issuePlace}, BRAZIL, {issueDateFormatted}</div>
                  <div style={{ borderTop: '1px solid #000080', marginTop: '8px', paddingTop: '4px' }}>
                    <div style={{ fontSize: '8px' }}>Signature</div>
                    <div style={{ borderBottom: '1px solid #000080', width: '90%', marginTop: '16px', marginBottom: '4px' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '9px', fontStyle: 'italic' }}>ROCHAMAR AGENCIA MARITIMA S A</div>
                    <div style={{ height: '4px' }} />
                    <div style={{ fontSize: '9px', fontStyle: 'italic', fontWeight: 'bold' }}>-&nbsp;&nbsp;AS AGENTS ONLY</div>
                    <div style={{ fontSize: '9px', fontStyle: 'italic', fontWeight: 'bold' }}>FOR AND ON BEHALF OF THE MASTER</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
