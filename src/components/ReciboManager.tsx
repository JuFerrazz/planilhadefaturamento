import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, Printer, Ship, Calendar, MapPin, Package, Trash2, ClipboardPaste, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { toast } from 'sonner';
import { parseCargoManifest, groupByShipper } from '@/lib/cargoManifestParser';
import { parsePastedData, groupByCustomsBroker, SugarEntry } from '@/lib/sugarReciboParser';
import { GrainRecibo } from './GrainRecibo';
import { SugarRecibo } from './SugarRecibo';
import { CargoManifestData } from '@/types/recibo';

type CargoType = 'SBS' | 'SBM' | 'CORN';

interface GrainReciboData {
  shipper: string;
  blNumbers: string[];
  quantity: number;
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
  const [grainManifestData, setGrainManifestData] = useState<CargoManifestData | null>(null);
  const [grainRecibos, setGrainRecibos] = useState<GrainReciboData[]>([]);
  const [grainProcessing, setGrainProcessing] = useState(false);
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
  
  const grainFileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Handle Cargo Manifest PDF upload
  const handleGrainFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Por favor, selecione um arquivo PDF (Cargo Manifest)');
      return;
    }

    setGrainProcessing(true);
    setShowGrainPreview(false);
    
    try {
      const data = await parseCargoManifest(file);
      
      if (!data || data.entries.length === 0) {
        toast.error('Não foi possível extrair dados do Cargo Manifest');
        setGrainProcessing(false);
        return;
      }
      
      setGrainManifestData(data);
      
      // Group by shipper
      const grouped = groupByShipper(data.entries);
      const recibos: GrainReciboData[] = [];
      
      grouped.forEach((value, shipper) => {
        recibos.push({
          shipper,
          blNumbers: value.blNumbers,
          quantity: value.totalQuantity
        });
      });
      
      setGrainRecibos(recibos);
    } catch (error) {
      console.error('Error processing cargo manifest:', error);
      toast.error('Erro ao processar o Cargo Manifest');
    }
    
    setGrainProcessing(false);
  }, []);

  // Handle Sugar pasted data
  const handleSugarPaste = useCallback(() => {
    if (!sugarPastedText.trim()) {
      toast.error('Cole os dados da planilha primeiro');
      return;
    }
    
    setShowSugarPreview(false);
    
    const data = parsePastedData(sugarPastedText);
    
    if (!data || data.entries.length === 0) {
      toast.error('Não foi possível extrair dados. Verifique se as colunas estão corretas: BL nbr, Name of shipper, Qtd per BL, Customs broker');
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
      setGrainManifestData(null);
      setGrainRecibos([]);
      setGrainDate(new Date());
      setGrainCargo('SBS');
      setShowGrainPreview(false);
      setCurrentGrainIndex(0);
      if (grainFileInputRef.current) grainFileInputRef.current.value = '';
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

              {/* Manifest info display */}
              {grainManifestData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Navio:</span>
                    <span className="text-sm">{grainManifestData.vessel || 'Não identificado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Porto:</span>
                    <span className="text-sm">{grainManifestData.port || 'Não identificado'}</span>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Carregar Cargo Manifest (PDF)</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => grainFileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleGrainFileUpload(file);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-primary');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                  }}
                >
                  <input
                    ref={grainFileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGrainFileUpload(file);
                    }}
                  />
                  {grainProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Processando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique ou arraste o arquivo Cargo Manifest (PDF) aqui
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {grainRecibos.length > 0 && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowGrainPreview(true)} variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview ({grainRecibos.length})
                  </Button>
                  <Button onClick={handlePrintAll} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir Todos
                  </Button>
                  <Button variant="outline" onClick={() => handleReset('grain')} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grain Recibos Preview */}
          {grainRecibos.length > 0 && grainManifestData && showGrainPreview && (
            <Card>
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
                    vessel={grainManifestData.vessel}
                    cargo={grainCargo}
                    port={grainManifestData.port}
                    shipper={grainRecibos[currentGrainIndex].shipper}
                    blNumbers={grainRecibos[currentGrainIndex].blNumbers}
                    quantity={grainRecibos[currentGrainIndex].quantity}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden recibos for printing */}
          {grainRecibos.length > 0 && grainManifestData && (
            <div ref={printRef} className="hidden print:block print:space-y-0">
              {grainRecibos.map((recibo, idx) => (
                <div key={idx} className="print:break-after-page">
                  <GrainRecibo
                    date={grainDate ? format(grainDate, 'dd/MM/yyyy') : ''}
                    vessel={grainManifestData.vessel}
                    cargo={grainCargo}
                    port={grainManifestData.port}
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
            <Card>
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
