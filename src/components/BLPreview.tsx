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
  const grossWeightFull = data.grossWeight !== null 
    ? data.grossWeight.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.')
    : '';

  // Check if cargo type needs "PACKING : IN BULK" on separate line
  const cargoNeedsPacking = data.cargoType !== 'CANE RAW SUGAR IN BULK';

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
          fontSize: '12px', 
          lineHeight: '1.3',
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm',
          color: '#000080'
        }}
      >
        {/* Main container WITHOUT outer border for print */}
        <div className="print:border-0" style={{ border: '2px solid #000080' }}>
          
          {/* CODE NAME Header */}
          <div style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold' }}>
            CODE NAME: "CONGENBILL" EDITION 1994
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Row: Shipper | BILL OF LADING | B/L No. */}
          <div style={{ display: 'flex' }}>
            {/* Left: Shipper */}
            <div style={{ width: '50%' }}>
              <div style={{ fontSize: '10px', padding: '2px 6px' }}>Shipper</div>
              <div style={{ padding: '4px 6px', fontWeight: 'bold', minHeight: '40px' }}>
                {data.shipperName || '[SHIPPER NAME]'}
              </div>
              <div style={{ padding: '4px 6px', minHeight: '20px' }}>
                CNPJ {data.shipperCnpj || '[CNPJ]'}
              </div>
            </div>
            {/* Center: BILL OF LADING */}
            <div style={{ width: '30%', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', paddingTop: '8px' }}>
                BILL OF LADING
              </div>
              <div style={{ fontSize: '10px', paddingTop: '4px' }}>
                TO BE USED WITH CHARTER-PARTIES
              </div>
            </div>
            {/* Right: B/L No. and Reference */}
            <div style={{ width: '20%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '4px 6px' }}>
                B/L No. {data.blNumber || '1'}
              </div>
              <div style={{ height: '30px' }} />
              <div style={{ fontSize: '10px', padding: '4px 6px' }}>Reference No.</div>
            </div>
          </div>

          {/* COPY NOT NEGOTIABLE */}
          <div style={{ textAlign: 'right', padding: '6px 20px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.15em' }}>
            C O P Y&nbsp;&nbsp;N O T&nbsp;&nbsp;N E G O T I A B L E
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Consignee */}
          <div style={{ padding: '4px 6px' }}>
            <div style={{ fontSize: '10px' }}>Consignee</div>
            <div style={{ height: '20px' }} />
            <div style={{ fontWeight: 'bold' }}>TO ORDER</div>
            <div style={{ height: '40px' }} />
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Notify address */}
          <div style={{ padding: '4px 6px' }}>
            <div style={{ fontSize: '10px' }}>Notify address</div>
            <div style={{ height: '80px' }} />
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Vessel | Port of loading */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', padding: '4px 6px' }}>
              <div style={{ fontSize: '10px' }}>Vessel</div>
              <div style={{ fontWeight: 'bold' }}>MV {data.vessel || '[VESSEL]'}</div>
              <div style={{ height: '15px' }} />
            </div>
            <div style={{ width: '50%', padding: '4px 6px' }}>
              <div style={{ fontSize: '10px' }}>Port of loading</div>
              <div style={{ fontWeight: 'bold' }}>{data.portOfLoading ? `${data.portOfLoading}, BRAZIL` : '[PORT], BRAZIL'}</div>
              <div style={{ height: '15px' }} />
            </div>
          </div>

          {/* HORIZONTAL LINE - half width */}
          <div style={{ borderBottom: '1px solid #000080', width: '50%' }} />

          {/* Port of discharge */}
          <div style={{ padding: '4px 6px' }}>
            <div style={{ fontSize: '10px' }}>Port of discharge</div>
            <div style={{ fontWeight: 'bold' }}>{data.portOfDischarge || '[PORT OF DISCHARGE]'}</div>
            <div style={{ height: '15px' }} />
          </div>

          {/* HORIZONTAL LINE - FULL width */}
          <div style={{ borderBottom: '2px solid #000080', width: '100%' }} />

          {/* Shipper's description of goods | Gross weight */}
          <div style={{ display: 'flex' }}>
            {/* Left: Description */}
            <div style={{ width: '75%', borderRight: '2px solid #000080' }}>
              <div style={{ fontSize: '10px', padding: '4px 6px' }}>Shipper's description of goods</div>
              <div style={{ padding: '8px 25px', minHeight: '220px' }}>
                <div style={{ fontWeight: 'bold' }}>BRAZILIAN {data.cargoType || '[CARGO TYPE]'}{!cargoNeedsPacking ? '' : ''}</div>
                {cargoNeedsPacking && <div style={{ fontWeight: 'bold' }}>PACKING : IN BULK</div>}
                <div style={{ height: '20px' }} />
                <div>DU-E: {data.duE || '[DU-E]'}</div>
                <div style={{ height: '15px' }} />
                <div>CE: {data.ce || '[CE]'}</div>
                <div style={{ height: '120px' }} />
                <div style={{ fontSize: '11px', fontStyle: 'italic', paddingLeft: '25px' }}>
                  (of which&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NIL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on deck at Shipper's risk; the Carriers not
                </div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', paddingLeft: '25px' }}>
                  being responsible for loss or damage howsoever arising)
                </div>
              </div>
            </div>
            {/* Right: Gross weight */}
            <div style={{ width: '25%' }}>
              <div style={{ fontSize: '10px', padding: '4px 6px' }}>Gross weight</div>
              <div style={{ padding: '8px 10px', textAlign: 'right' }}>
                <div style={{ height: '50px' }} />
                <div style={{ fontWeight: 'bold' }}>{data.grossWeight !== null ? `${grossWeightFull}  MT` : '[WEIGHT]  MT'}</div>
              </div>
            </div>
          </div>

          {/* HORIZONTAL LINE - FULL width */}
          <div style={{ borderBottom: '2px solid #000080', width: '100%' }} />

          {/* Bottom Section - 2 main columns */}
          <div style={{ display: 'flex' }}>
            {/* Left Column - Freight info */}
            <div style={{ width: '30%', borderRight: '2px solid #000080', padding: '6px' }}>
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Freight payable as per</div>
              <div style={{ fontStyle: 'italic' }}>CHARTER-PARTY DATED</div>
              <div style={{ height: '35px' }} />
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>FREIGHT ADVANCE.</div>
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Received on account of freight:</div>
              <div style={{ height: '25px' }} />
              <div style={{ borderBottom: '1px solid #000080', width: '90%', marginBottom: '12px' }} />
              <div style={{ height: '25px' }} />
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Time used for loading............ ....days.... .............hours.</div>
              <div style={{ height: '25px', borderBottom: '2px solid #000080' }} />
              <div style={{ padding: '6px 0', fontWeight: 'bold' }}>
                USD {formatCurrency(calculatedValue)}
              </div>
            </div>

            {/* Right Side - Contains SHIPPED text and sub-sections */}
            <div style={{ width: '70%' }}>
              {/* SHIPPED text section */}
              <div style={{ padding: '6px', fontSize: '11px' }}>
                <span style={{ fontWeight: 'bold' }}>SHIPPED</span>&nbsp;&nbsp;at&nbsp;&nbsp;the&nbsp;&nbsp;Port&nbsp;&nbsp;of&nbsp;&nbsp;Loading&nbsp;&nbsp;in&nbsp;&nbsp;apparent&nbsp;&nbsp;&nbsp;&nbsp;good
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px', paddingLeft: '50px' }}>
                order&nbsp;&nbsp;&nbsp;and&nbsp;&nbsp;&nbsp;condition&nbsp;&nbsp;&nbsp;on&nbsp;&nbsp;board&nbsp;&nbsp;the&nbsp;&nbsp;Vessel
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                for carriage&nbsp;&nbsp;to&nbsp;&nbsp;the&nbsp;&nbsp;Port of Discharge or so near thereto
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                as&nbsp;&nbsp;&nbsp;she&nbsp;&nbsp;may&nbsp;&nbsp;safely&nbsp;&nbsp;get&nbsp;&nbsp;&nbsp;the&nbsp;&nbsp;&nbsp;goods&nbsp;&nbsp;specified&nbsp;&nbsp;above.
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                Weight,&nbsp;&nbsp;measure,&nbsp;&nbsp;quality,&nbsp;&nbsp;quantity,&nbsp;&nbsp;condition,&nbsp;&nbsp;contents
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                and value unknown.
              </div>
              <div style={{ padding: '6px', fontSize: '11px' }}>
                <span style={{ fontWeight: 'bold' }}>IN WITNESS</span>&nbsp;&nbsp;whereof the&nbsp;&nbsp;Master&nbsp;&nbsp;or&nbsp;&nbsp;Agent&nbsp;&nbsp;of&nbsp;&nbsp;the&nbsp;&nbsp;said
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                Vessel has signed the number of Bills of Lading indicated
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                below all of this tenor and&nbsp;&nbsp;date,&nbsp;&nbsp;any&nbsp;&nbsp;one&nbsp;&nbsp;of which being
              </div>
              <div style={{ padding: '0 6px', fontSize: '11px' }}>
                accomplished the others shall be void.
              </div>
              
              {/* FOR CONDITIONS line */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', borderTop: '1px solid #000080', borderBottom: '1px solid #000080', padding: '6px', marginTop: '12px' }}>
                FOR CONDITIONS OF CARRIAGE SEE OVERLEAF
              </div>

              {/* Bottom sub-sections - 2 columns */}
              <div style={{ display: 'flex' }}>
                <div style={{ width: '40%', borderRight: '1px solid #000080', padding: '6px' }}>
                  <div style={{ fontSize: '10px' }}>Freight payable at</div>
                  <div style={{ height: '25px' }} />
                  <div style={{ borderTop: '1px solid #000080', paddingTop: '6px' }}>
                    <div style={{ fontSize: '10px' }}>Number of original Bs/L</div>
                    <div style={{ height: '12px' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>3 ( THREE)</div>
                  </div>
                </div>
                <div style={{ width: '60%', padding: '6px' }}>
                  <div style={{ fontSize: '10px' }}>Place and date of issue <span style={{ fontStyle: 'italic' }}>SHIPPED ON BOARD</span></div>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{issuePlace}, BRAZIL, {issueDateFormatted}</div>
                  <div style={{ borderTop: '1px solid #000080', marginTop: '12px', paddingTop: '6px' }}>
                    <div style={{ fontSize: '10px' }}>Signature</div>
                    <div style={{ borderBottom: '1px solid #000080', width: '90%', marginTop: '20px', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '11px', fontStyle: 'italic' }}>ROCHAMAR AGENCIA MARITIMA S A</div>
                    <div style={{ height: '6px' }} />
                    <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold' }}>-&nbsp;&nbsp;AS AGENTS ONLY</div>
                    <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold' }}>FOR AND ON BEHALF OF THE MASTER</div>
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
