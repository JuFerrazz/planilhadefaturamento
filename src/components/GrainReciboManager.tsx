import { useState, useCallback } from 'react';
import { FileText, Printer, Ship, Calendar, MapPin, Package, Trash2, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrainRecibo } from './GrainRecibo';

type CargoType = 'SBS' | 'SBM' | 'CORN';

interface GrainEntry {
  id: number;
  blNumber: string;
  shipper: string;
  quantity: string;
}

interface GrainReciboData {
  shipper: string;
  blNumbers: string[];
  quantity: string; // Mudado para string para preservar decimais exatos
}

export function GrainReciboManager() {
  const [grainDate, setGrainDate] = useState<Date | undefined>(new Date());
  const [grainCargo, setGrainCargo] = useState<CargoType>('SBS');
  const [grainVessel, setGrainVessel] = useState('');
  const [grainPort, setGrainPort] = useState('');
  const [grainEntries, setGrainEntries] = useState<GrainEntry[]>([
    { id: 1, blNumber: '', shipper: '', quantity: '' }
  ]);
  const [grainRecibos, setGrainRecibos] = useState<GrainReciboData[]>([]);
  const [showGrainPreview, setShowGrainPreview] = useState(false);
  const [currentGrainIndex, setCurrentGrainIndex] = useState(0);

  // Grain entry handlers
  const handleAddGrainEntry = useCallback(() => {
    const newId = Math.max(...grainEntries.map(e => e.id), 0) + 1;
    setGrainEntries(prev => [...prev, { id: newId, blNumber: '', shipper: '', quantity: '' }]);
  }, [grainEntries]);

  const handleRemoveGrainEntry = useCallback((id: number) => {
    if (grainEntries.length <= 1) return;
    setGrainEntries(prev => prev.filter(e => e.id !== id));
  }, [grainEntries.length]);

  const handleGrainEntryChange = useCallback((id: number, field: keyof GrainEntry, value: string) => {
    setGrainEntries(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  }, []);

  // Process grain entries into recibos (grouped by shipper)
  const handleProcessGrain = useCallback(() => {
    const validEntries = grainEntries.filter(e => e.blNumber.trim() && e.shipper.trim() && e.quantity.trim());
    
    if (validEntries.length === 0) {
      return;
    }

    if (!grainVessel.trim() || !grainPort.trim()) {
      return;
    }

    // Group by shipper
    const grouped = new Map<string, { blNumbers: string[]; quantities: string[] }>();
    
    validEntries.forEach(entry => {
      const shipper = entry.shipper.trim().toUpperCase();
      const qty = entry.quantity.trim(); // Mantém como string
      
      if (grouped.has(shipper)) {
        const existing = grouped.get(shipper)!;
        existing.blNumbers.push(entry.blNumber.trim());
        existing.quantities.push(qty);
      } else {
        grouped.set(shipper, {
          blNumbers: [entry.blNumber.trim()],
          quantities: [qty]
        });
      }
    });

    const recibos: GrainReciboData[] = [];
    grouped.forEach((value, shipper) => {
      // Soma as quantidades preservando decimais
      const totalQuantity = value.quantities.reduce((sum, qtyStr) => {
        const qty = parseFloat(qtyStr.replace(',', '.')) || 0;
        return sum + qty;
      }, 0);
      
      // Usa toFixed com muitas casas decimais - NÃO remove zeros
      const quantityStr = totalQuantity.toFixed(10); // 10 casas decimais
      
      recibos.push({
        shipper,
        blNumbers: value.blNumbers,
        quantity: quantityStr
      });
    });

    setGrainRecibos(recibos);
    setShowGrainPreview(true);
    setCurrentGrainIndex(0);
  }, [grainEntries, grainVessel, grainPort]);

  const handlePrintAll = useCallback(() => {
    window.print();
  }, []);

  const handleReset = useCallback(() => {
    setGrainRecibos([]);
    setGrainDate(new Date());
    setGrainCargo('SBS');
    setGrainVessel('');
    setGrainPort('');
    setGrainEntries([{ id: 1, blNumber: '', shipper: '', quantity: '' }]);
    setShowGrainPreview(false);
    setCurrentGrainIndex(0);
  }, []);

  // Carousel navigation functions
  const nextGrainRecibo = useCallback(() => {
    setCurrentGrainIndex(prev => (prev + 1) % grainRecibos.length);
  }, [grainRecibos.length]);

  const prevGrainRecibo = useCallback(() => {
    setCurrentGrainIndex(prev => (prev - 1 + grainRecibos.length) % grainRecibos.length);
  }, [grainRecibos.length]);

  return (
    <div className="w-full max-w-4xl mx-auto print:max-w-none print:w-full">
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recibo de Grãos
            </CardTitle>
            {(grainRecibos.length > 0 || grainVessel) && (
              <Button 
                onClick={handleReset} 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Cargo Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {grainDate ? format(grainDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={grainDate}
                    onSelect={setGrainDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Carga
              </Label>
              <Select value={grainCargo} onValueChange={(v) => setGrainCargo(v as CargoType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SBS">SBS</SelectItem>
                  <SelectItem value="SBM">SBM</SelectItem>
                  <SelectItem value="CORN">CORN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vessel and Port */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Navio
              </Label>
              <Input 
                value={grainVessel} 
                onChange={(e) => setGrainVessel(e.target.value)}
                placeholder="Nome do navio"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Porto
              </Label>
              <Input 
                value={grainPort} 
                onChange={(e) => setGrainPort(e.target.value)}
                placeholder="Porto de embarque"
              />
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            <Label>Entradas (BL, Shipper, Quantity)</Label>
            {grainEntries.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <Input 
                    value={entry.blNumber}
                    onChange={(e) => handleGrainEntryChange(entry.id, 'blNumber', e.target.value)}
                    placeholder="BL #"
                  />
                </div>
                <div className="col-span-5">
                  <Input 
                    value={entry.shipper}
                    onChange={(e) => handleGrainEntryChange(entry.id, 'shipper', e.target.value)}
                    placeholder="Nome do Shipper"
                  />
                </div>
                <div className="col-span-3">
                  <Input 
                    value={entry.quantity}
                    onChange={(e) => handleGrainEntryChange(entry.id, 'quantity', e.target.value)}
                    placeholder="Quantidade"
                  />
                </div>
                <div className="col-span-1">
                  {grainEntries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveGrainEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddGrainEntry}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Entrada
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap pt-2">
            <Button onClick={handleProcessGrain} className="gap-2">
              <FileText className="w-4 h-4" />
              Gerar Recibos
            </Button>
          </div>

          {/* Preview Section */}
          {showGrainPreview && grainRecibos.length > 0 && (
            <Card className="mt-4 print:hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Preview dos Recibos</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevGrainRecibo}
                      disabled={grainRecibos.length <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentGrainIndex + 1} de {grainRecibos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextGrainRecibo}
                      disabled={grainRecibos.length <= 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                  <GrainRecibo
                    date={grainDate ? format(grainDate, 'dd/MM/yyyy') : ''}
                    vessel={grainVessel}
                    cargo={grainCargo}
                    port={grainPort}
                    shipper={grainRecibos[currentGrainIndex].shipper}
                    blNumbers={grainRecibos[currentGrainIndex].blNumbers}
                    quantity={grainRecibos[currentGrainIndex].quantity}
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <Button onClick={handlePrintAll} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir Todos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Hidden recibos for printing */}
      {grainRecibos.length > 0 && (
        <div className="hidden print:block print:space-y-0">
          {grainRecibos.map((recibo, idx) => (
            <div key={idx} className="print:break-after-page">
              <GrainRecibo
                date={grainDate ? format(grainDate, 'dd/MM/yyyy') : ''}
                vessel={grainVessel}
                cargo={grainCargo}
                port={grainPort}
                shipper={recibo.shipper}
                blNumbers={recibo.blNumbers}
                quantity={recibo.quantity}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
