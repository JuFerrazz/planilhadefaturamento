import { useState, useCallback, useRef } from 'react';
import { FileText, Printer, Ship, Calendar, MapPin, Package, Trash2, ClipboardPaste, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parsePastedData, groupByCustomsBroker, SugarEntry } from '@/lib/sugarReciboParser';
import { GrainRecibo } from './GrainRecibo';
import { SugarRecibo } from './SugarRecibo';

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
  quantity: string; // Mudado para string para preservar todas as casas decimais
}

interface SugarReciboGroupData {
  customsBroker: string;
  entries: SugarEntry[];
}

export function ReciboManager() {
  const [activeTab, setActiveTab] = useState<'grain' | 'sugar'>('grain');
  
  // Grain state
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
  
  // Sugar state
  const [sugarDate, setSugarDate] = useState<Date | undefined>(new Date());
  const [sugarVessel, setSugarVessel] = useState('');
  const [sugarPort, setSugarPort] = useState('');
  const [sugarRecibos, setSugarRecibos] = useState<SugarReciboGroupData[]>([]);
  const [sugarPastedText, setSugarPastedText] = useState('');
  const [showSugarPreview, setShowSugarPreview] = useState(false);
  const [currentSugarIndex, setCurrentSugarIndex] = useState(0);
  
  const printRef = useRef<HTMLDivElement>(null);

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
    const grouped = new Map<string, { blNumbers: string[]; totalQuantity: number }>();
    
    validEntries.forEach(entry => {
      const shipper = entry.shipper.trim().toUpperCase();
      const qty = parseFloat(entry.quantity.replace(',', '.')) || 0;
      
      if (grouped.has(shipper)) {
        const existing = grouped.get(shipper)!;
        existing.blNumbers.push(entry.blNumber.trim());
        existing.totalQuantity += qty;
      } else {
        grouped.set(shipper, {
          blNumbers: [entry.blNumber.trim()],
          totalQuantity: qty
        });
      }
    });

    const recibos: GrainReciboData[] = [];
    grouped.forEach((value, shipper) => {
      // Determina o número de casas decimais baseado nos valores originais
      // Usa toFixed com pelo menos 3 casas decimais
      const quantityStr = value.totalQuantity.toFixed(3);
      
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

  // Handle Sugar pasted data
  const handleSugarPaste = useCallback(() => {
    if (!sugarPastedText.trim()) {
      return;
    }
    
    setShowSugarPreview(false);
    
    const data = parsePastedData(sugarPastedText);
    
    if (!data || data.entries.length === 0) {
      return;
    }
    
    // Group by customs broker
    const grouped = groupByCustomsBroker(data.entries);
    const recibos: SugarReciboGroupData[] = [];
    
    grouped.forEach((entries, customsBroker) => {
      recibos.push({
        customsBroker,
        entries
      });
    });
    
    setSugarRecibos(recibos);
  }, [sugarPastedText]);

  const handlePrintAll = useCallback(() => {
    window.print();
  }, []);

  const handleReset = useCallback((type: 'grain' | 'sugar') => {
    if (type === 'grain') {
      setGrainRecibos([]);
      setGrainDate(new Date());
      setGrainCargo('SBS');
      setGrainVessel('');
      setGrainPort('');
      setGrainEntries([{ id: 1, blNumber: '', shipper: '', quantity: '' }]);
      setShowGrainPreview(false);
      setCurrentGrainIndex(0);
    } else {
      setSugarRecibos([]);
      setSugarDate(new Date());
      setSugarVessel('');
      setSugarPort('');
      setSugarPastedText('');
      setShowSugarPreview(false);
      setCurrentSugarIndex(0);
    }
  }, []);

  // Carousel navigation functions
  const nextGrainRecibo = useCallback(() => {
    setCurrentGrainIndex(prev => (prev + 1) % grainRecibos.length);
  }, [grainRecibos.length]);

  const prevGrainRecibo = useCallback(() => {
    setCurrentGrainIndex(prev => (prev - 1 + grainRecibos.length) % grainRecibos.length);
  }, [grainRecibos.length]);

  const nextSugarRecibo = useCallback(() => {
    setCurrentSugarIndex(prev => (prev + 1) % sugarRecibos.length);
  }, [sugarRecibos.length]);

  const prevSugarRecibo = useCallback(() => {
    setCurrentSugarIndex(prev => (prev - 1 + sugarRecibos.length) % sugarRecibos.length);
  }, [sugarRecibos.length]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'grain' | 'sugar')}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 print:hidden">
          <TabsTrigger value="grain" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Grãos (SBS/SBM/CORN)
          </TabsTrigger>
          <TabsTrigger value="sugar" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Açúcar
          </TabsTrigger>
        </TabsList>

        {/* Grain Tab */}
        <TabsContent value="grain" className="space-y-6">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recibo de Grãos
              </CardTitle>
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
                        placeholder="BL Number"
                      />
                    </div>
                    <div className="col-span-5">
                      <Input 
                        value={entry.shipper}
                        onChange={(e) => handleGrainEntryChange(entry.id, 'shipper', e.target.value)}
                        placeholder="Shipper"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        value={entry.quantity}
                        onChange={(e) => handleGrainEntryChange(entry.id, 'quantity', e.target.value)}
                        placeholder="Qty (MT)"
                        type="text"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGrainEntry(entry.id)}
                        disabled={grainEntries.length <= 1}
                        className="w-full p-0 h-8"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={handleAddGrainEntry}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Entrada
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={handleProcessGrain} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Gerar Recibos
                </Button>
                {grainRecibos.length > 0 && (
                  <>
                    <Button onClick={handlePrintAll} variant="outline" className="gap-2">
                      <Printer className="w-4 h-4" />
                      Imprimir Todos
                    </Button>
                    <Button variant="outline" onClick={() => handleReset('grain')} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Limpar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grain Recibos Preview */}
          {grainRecibos.length > 0 && showGrainPreview && (
            <Card className="print:hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview dos Recibos</CardTitle>
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
                <div className="border rounded-lg overflow-hidden">
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
              </CardContent>
            </Card>
          )}

          {/* Hidden recibos for printing */}
          {grainRecibos.length > 0 && (
            <div ref={printRef} className="hidden print:block print:space-y-0">
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
        </TabsContent>

        {/* Sugar Tab */}
        <TabsContent value="sugar" className="space-y-6">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recibo de Açúcar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date, Vessel and Port */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {sugarDate ? format(sugarDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={sugarDate}
                        onSelect={setSugarDate}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    Navio
                  </Label>
                  <Input 
                    value={sugarVessel} 
                    onChange={(e) => setSugarVessel(e.target.value)}
                    placeholder="Nome do navio"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Porto
                  </Label>
                  <Input 
                    value={sugarPort} 
                    onChange={(e) => setSugarPort(e.target.value)}
                    placeholder="Porto de embarque"
                  />
                </div>
              </div>

              {/* Paste Area */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4" />
                  Colar Planilha (BL nbr, Name of shipper, Qtd per BL, Customs broker)
                </Label>
                <Textarea
                  value={sugarPastedText}
                  onChange={(e) => setSugarPastedText(e.target.value)}
                  placeholder="Cole aqui os dados da planilha (copie as colunas BL nbr, Name of shipper, Qtd per BL e Customs broker do Excel)..."
                  className="min-h-[120px] font-mono text-sm"
                />
                <Button onClick={handleSugarPaste} className="gap-2 w-full">
                  <ClipboardPaste className="w-4 h-4" />
                  Processar Dados Colados
                </Button>
              </div>

              {/* Actions */}
              {sugarRecibos.length > 0 && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowSugarPreview(true)} variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview ({sugarRecibos.length})
                  </Button>
                  <Button onClick={handlePrintAll} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir Todos
                  </Button>
                  <Button variant="outline" onClick={() => handleReset('sugar')} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sugar Recibos Preview */}
          {sugarRecibos.length > 0 && showSugarPreview && (
            <Card className="print:hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview dos Recibos</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevSugarRecibo}
                      disabled={sugarRecibos.length <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentSugarIndex + 1} de {sugarRecibos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextSugarRecibo}
                      disabled={sugarRecibos.length <= 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <SugarRecibo
                    date={sugarDate ? format(sugarDate, 'dd/MM/yyyy') : ''}
                    vessel={sugarVessel}
                    port={sugarPort}
                    customsBroker={sugarRecibos[currentSugarIndex].customsBroker}
                    entries={sugarRecibos[currentSugarIndex].entries}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden recibos for printing */}
          {sugarRecibos.length > 0 && (
            <div className="hidden print:block print:space-y-0">
              {sugarRecibos.map((recibo, idx) => (
                <div key={idx} className="print:break-after-page">
                  <SugarRecibo
                    date={sugarDate ? format(sugarDate, 'dd/MM/yyyy') : ''}
                    vessel={sugarVessel}
                    port={sugarPort}
                    customsBroker={recibo.customsBroker}
                    entries={recibo.entries}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
