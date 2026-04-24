import { useState, useCallback } from 'react';
import { FileText, Printer, Ship, Calendar, MapPin, Hash, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrampRecibo } from './TrampRecibo';

interface TrampEntry {
  id: number;
  blNumber: string;
  shipper: string;
}

interface TrampReciboData {
  shipper: string;
  blNumbers: string[];
}

interface TrampReciboManagerProps {
  variant?: 'tramp' | 'g2';
}

export function TrampReciboManager({ variant = 'tramp' }: TrampReciboManagerProps) {
  const label = variant === 'g2' ? 'G2' : 'TRAMP';
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [voy, setVoy] = useState('');
  const [vessel, setVessel] = useState('');
  const [port, setPort] = useState('');
  const [entries, setEntries] = useState<TrampEntry[]>([
    { id: 1, blNumber: '', shipper: '' }
  ]);
  const [recibos, setRecibos] = useState<TrampReciboData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAddEntry = useCallback(() => {
    setEntries(prev => {
      const newId = Math.max(...prev.map(e => e.id), 0) + 1;
      return [...prev, { id: newId, blNumber: '', shipper: '' }];
    });
  }, []);

  const handleRemoveEntry = useCallback((id: number) => {
    setEntries(prev => prev.length <= 1 ? prev : prev.filter(e => e.id !== id));
  }, []);

  const handleEntryChange = useCallback((id: number, field: keyof TrampEntry, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const handleProcess = useCallback(() => {
    const valid = entries.filter(e => e.blNumber.trim() && e.shipper.trim());
    if (valid.length === 0 || !vessel.trim() || !port.trim() || !voy.trim()) return;

    const grouped = new Map<string, string[]>();
    valid.forEach(e => {
      const s = e.shipper.trim().toUpperCase();
      if (grouped.has(s)) grouped.get(s)!.push(e.blNumber.trim());
      else grouped.set(s, [e.blNumber.trim()]);
    });

    const result: TrampReciboData[] = [];
    grouped.forEach((blNumbers, shipper) => result.push({ shipper, blNumbers }));

    setRecibos(result);
    setShowPreview(true);
    setCurrentIndex(0);
  }, [entries, vessel, port, voy]);

  const handlePrintAll = useCallback(() => window.print(), []);

  const handleReset = useCallback(() => {
    setRecibos([]);
    setDate(new Date());
    setVoy('');
    setVessel('');
    setPort('');
    setEntries([{ id: 1, blNumber: '', shipper: '' }]);
    setShowPreview(false);
    setCurrentIndex(0);
  }, []);

  const next = useCallback(() => setCurrentIndex(p => (p + 1) % recibos.length), [recibos.length]);
  const prev = useCallback(() => setCurrentIndex(p => (p - 1 + recibos.length) % recibos.length), [recibos.length]);

  return (
    <div className="w-full max-w-4xl mx-auto print:max-w-none print:w-full">
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recibo {label}
            </CardTitle>
            {(recibos.length > 0 || vessel) && (
              <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                VOY
              </Label>
              <Input value={voy} onChange={(e) => setVoy(e.target.value)} placeholder="Número da viagem (ex: 123)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Navio
              </Label>
              <Input value={vessel} onChange={(e) => setVessel(e.target.value)} placeholder="Nome do navio" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Porto
              </Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="Porto de embarque" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Entradas (BL, Shipper)</Label>
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Input value={entry.blNumber} onChange={(e) => handleEntryChange(entry.id, 'blNumber', e.target.value)} placeholder="BL #" />
                </div>
                <div className="col-span-7">
                  <Input value={entry.shipper} onChange={(e) => handleEntryChange(entry.id, 'shipper', e.target.value)} placeholder="Nome do Shipper" />
                </div>
                <div className="col-span-1">
                  {entries.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveEntry(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddEntry} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Entrada
            </Button>
          </div>

          <div className="flex gap-3 flex-wrap pt-2">
            <Button onClick={handleProcess} className="gap-2">
              <FileText className="w-4 h-4" />
              Gerar Recibos
            </Button>
          </div>

          {showPreview && recibos.length > 0 && (
            <Card className="mt-4 print:hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Preview dos Recibos</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={prev} disabled={recibos.length <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentIndex + 1} de {recibos.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={next} disabled={recibos.length <= 1}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                  <TrampRecibo
                    date={date ? format(date, 'dd/MM/yyyy') : ''}
                    vessel={vessel}
                    voy={voy}
                    port={port}
                    shipper={recibos[currentIndex].shipper}
                    blNumbers={recibos[currentIndex].blNumbers}
                    variant={variant}
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

      {recibos.length > 0 && (
        <div className="hidden print:block print:space-y-0">
          {recibos.map((recibo, idx) => (
            <div key={idx} className="print:break-after-page">
              <TrampRecibo
                date={date ? format(date, 'dd/MM/yyyy') : ''}
                vessel={vessel}
                voy={voy}
                port={port}
                shipper={recibo.shipper}
                blNumbers={recibo.blNumbers}
                variant={variant}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
