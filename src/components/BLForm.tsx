import { BLData, calculateValue, formatCurrency } from '@/types/bl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PdfDropZone } from './PdfDropZone';
import { ParsedDUEData } from '@/lib/pdfParser';

const CARGO_OPTIONS = [
  { value: 'SOYBEANS', label: 'BRAZILIAN SOYBEANS PACKING : IN BULK' },
  { value: 'CANE RAW SUGAR IN BULK', label: 'BRAZILIAN CANE RAW SUGAR IN BULK' },
  { value: 'SOYBEANS MEAL', label: 'BRAZILIAN SOYBEANS MEAL PACKING : IN BULK' },
  { value: 'YELLOW CORN', label: 'BRAZILIAN YELLOW CORN PACKING : IN BULK' },
  { value: 'SOYBEANS OIL', label: 'BRAZILIAN SOYBEANS OIL PACKING : IN BULK' },
  { value: 'GOLDEN DISTILLERS DRIED GRAINS SOLUBLE', label: 'BRAZILIAN GOLDEN DISTILLERS DRIED GRAINS SOLUBLE PACKING : IN BULK' },
];

interface BLFormProps {
  data: BLData;
  onChange: (data: BLData) => void;
}

export const BLForm = ({ data, onChange }: BLFormProps) => {
  const updateField = <K extends keyof BLData>(field: K, value: BLData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handlePdfData = (pdfData: ParsedDUEData) => {
    onChange({
      ...data,
      duE: pdfData.duE || data.duE,
      shipperCnpj: pdfData.shipperCnpj || data.shipperCnpj,
      shipperName: pdfData.shipperName || data.shipperName,
      grossWeight: pdfData.grossWeight || data.grossWeight,
    });
  };

  const calculatedValue = calculateValue(data.grossWeight);

  return (
    <div className="space-y-6">
      {/* PDF Drop Zone */}
      <PdfDropZone onDataExtracted={handlePdfData} />

      {/* BL Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blNumber">B/L No.</Label>
          <Input
            id="blNumber"
            value={data.blNumber}
            onChange={(e) => updateField('blNumber', e.target.value)}
          />
        </div>
      </div>

      {/* Shipper Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Shipper
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shipperName">Nome do Shipper *</Label>
            <Input
              id="shipperName"
              value={data.shipperName}
              onChange={(e) => updateField('shipperName', e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipperCnpj">CNPJ *</Label>
            <Input
              id="shipperCnpj"
              value={data.shipperCnpj}
              onChange={(e) => updateField('shipperCnpj', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Vessel & Ports Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Vessel & Ports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vessel">Vessel (Nome do Navio) *</Label>
            <Input
              id="vessel"
              value={data.vessel}
              onChange={(e) => updateField('vessel', e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portOfLoading">Port of Loading *</Label>
            <Input
              id="portOfLoading"
              value={data.portOfLoading}
              onChange={(e) => updateField('portOfLoading', e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portOfDischarge">Port of Discharge</Label>
            <Input
              id="portOfDischarge"
              value={data.portOfDischarge}
              onChange={(e) => updateField('portOfDischarge', e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
        </div>
      </div>

      {/* Cargo Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Shipper's Description of Goods
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cargoType">Tipo de Carga *</Label>
            <Select value={data.cargoType} onValueChange={(value) => updateField('cargoType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de carga" />
              </SelectTrigger>
              <SelectContent>
                {CARGO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duE">DU-E</Label>
              <Input
                id="duE"
                value={data.duE}
                onChange={(e) => updateField('duE', e.target.value.toUpperCase())}
                placeholder="25BR0000000000"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ce">CE</Label>
              <Input
                id="ce"
                value={data.ce}
                onChange={(e) => updateField('ce', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weight & Value Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Weight & Value
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grossWeight">Gross Weight (MT) *</Label>
            <Input
              id="grossWeight"
              type="number"
              step="0.001"
              value={data.grossWeight ?? ''}
              onChange={(e) => updateField('grossWeight', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor (USD) - Calculado automaticamente</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
              <span className="text-foreground">
                USD {formatCurrency(calculatedValue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Gross Weight × 30 = {data.grossWeight ?? 0} × 30
            </p>
          </div>
        </div>
      </div>

      {/* Issue Date Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Place and Date of Issue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Local de Emissão</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
              <span className="text-foreground">
                {data.portOfLoading || 'SANTOS'}, BRAZIL
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data de Emissão *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.issueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.issueDate ? format(data.issueDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.issueDate ?? undefined}
                  onSelect={(date) => updateField('issueDate', date ?? null)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};
