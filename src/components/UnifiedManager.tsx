import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, Download, RefreshCw, ClipboardPaste, Copy, Ship, Trash2, Sparkles, Mail, Printer, Eye, ChevronLeft, ChevronRight, Calendar, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processExcelFile, generateExcelDownload, processPastedData, generateClipboardData, ProcessingResult, OutputRow } from '@/lib/excelProcessor';
import { findDespachanteEmail } from '@/lib/despachantesEmails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { GrainRecibo } from './GrainRecibo';

type UploadState = 'idle' | 'dragging' | 'processing' | 'success' | 'error';
type CargoType = 'SBS' | 'SBM' | 'CORN';

interface GrainReciboData {
  shipper: string;
  blNumbers: string[];
  quantity: number;
}

// Parse spreadsheet data for recibos (extracts quantity info)
interface RawEntry {
  blNumber: string;
  shipper: string;
  quantity: number;
  broker: string;
}

export function UnifiedManager() {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [shipName, setShipName] = useState<string>('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processedData, setProcessedData] = useState<OutputRow[] | null>(null);
  const [rawEntries, setRawEntries] = useState<RawEntry[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Recibos state
  const [reciboDate, setReciboDate] = useState<Date | undefined>(new Date());
  const [reciboCargo, setReciboCargo] = useState<CargoType>('SBS');
  const [reciboPort, setReciboPort] = useState('');
  const [grainRecibos, setGrainRecibos] = useState<GrainReciboData[]>([]);
  const [showReciboPreview, setShowReciboPreview] = useState(false);
  const [currentReciboIndex, setCurrentReciboIndex] = useState(0);
  const [activeOutputTab, setActiveOutputTab] = useState<'faturamento' | 'recibos'>('faturamento');

  // Parse raw entries from pasted/uploaded data for recibos
  const parseRawEntries = useCallback((text: string): RawEntry[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) return [];

    const firstLineValues = lines[0].split('\t').map(h => h.trim());
    const hasHeader = firstLineValues.some(v => 
      v.toLowerCase().includes('shipper') || 
      v.toLowerCase().includes('bl') ||
      v.toLowerCase().includes('qtd')
    );

    const headers = hasHeader 
      ? firstLineValues.map(h => h.toLowerCase())
      : ['name of shipper', 'qtd per bl', 'bl nbr', 'qtd per du-e', 'cnpj/vat', 'du-e', 'customs broker'];
    
    const dataStartIndex = hasHeader ? 1 : 0;

    // Find column indices
    const shipperIdx = headers.findIndex(h => h.includes('shipper'));
    const blIdx = headers.findIndex(h => h === 'bl nbr' || h.includes('bl n'));
    const qtyIdx = headers.findIndex(h => h.includes('qtd per bl') || (h.includes('qtd') && !h.includes('du')));
    const brokerIdx = headers.findIndex(h => h.includes('broker') || h.includes('customs'));

    const entries: RawEntry[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const shipper = values[shipperIdx]?.trim() || '';
      const blNumber = values[blIdx]?.trim() || '';
      const broker = values[brokerIdx]?.trim() || '';
      
      // Parse quantity
      let qtyRaw = values[qtyIdx]?.trim() || '0';
      let quantity = 0;
      if (qtyRaw) {
        // Handle Brazilian/US number formats
        const cleanQty = qtyRaw.replace(/\s/g, '');
        if (cleanQty.includes(',') && cleanQty.includes('.')) {
          const lastDot = cleanQty.lastIndexOf('.');
          const lastComma = cleanQty.lastIndexOf(',');
          if (lastComma > lastDot) {
            quantity = parseFloat(cleanQty.replace(/\./g, '').replace(',', '.'));
          } else {
            quantity = parseFloat(cleanQty.replace(/,/g, ''));
          }
        } else if (cleanQty.includes(',')) {
          quantity = parseFloat(cleanQty.replace(',', '.'));
        } else {
          quantity = parseFloat(cleanQty) || 0;
        }
      }

      if (shipper && blNumber) {
        entries.push({ blNumber, shipper, quantity, broker });
      }
    }
    
    return entries;
  }, []);

  const handleProcessingResult = useCallback((processingResult: ProcessingResult, sourceName: string, rawText?: string) => {
    setResult(processingResult);

    if (processingResult.success && processingResult.data) {
      setProcessedData(processingResult.data);
      setState('success');
      
      // Parse raw entries for recibos if we have the raw text
      if (rawText) {
        const entries = parseRawEntries(rawText);
        setRawEntries(entries);
        
        // Auto-generate recibos grouped by shipper
        const grouped = new Map<string, { blNumbers: string[]; totalQuantity: number }>();
        entries.forEach(entry => {
          const shipper = entry.shipper.toUpperCase();
          if (grouped.has(shipper)) {
            const existing = grouped.get(shipper)!;
            existing.blNumbers.push(entry.blNumber);
            existing.totalQuantity += entry.quantity;
          } else {
            grouped.set(shipper, {
              blNumbers: [entry.blNumber],
              totalQuantity: entry.quantity
            });
          }
        });
        
        const recibos: GrainReciboData[] = [];
        grouped.forEach((value, shipper) => {
          recibos.push({
            shipper,
            blNumbers: value.blNumbers,
            quantity: value.totalQuantity
          });
        });
        setGrainRecibos(recibos);
      }
      
      toast.success(`Dados processados com sucesso! ${processingResult.data.length} registros para faturamento.`);
    } else {
      setState('error');
      toast.error(processingResult.error || 'Erro ao processar dados');
    }
  }, [parseRawEntries]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setFileName(file.name);
    setState('processing');
    setResult(null);
    setProcessedData(null);
    setRawEntries([]);
    setGrainRecibos([]);

    const processingResult = await processExcelFile(file);
    // For file upload, we need to read raw content - for now just process faturamento
    handleProcessingResult(processingResult, file.name);
  }, [handleProcessingResult]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text');
    if (!text || state !== 'idle') return;

    if (!text.includes('\t')) {
      return;
    }

    e.preventDefault();
    setFileName('Dados colados');
    setState('processing');
    setResult(null);
    setProcessedData(null);
    setRawEntries([]);
    setGrainRecibos([]);

    const processingResult = processPastedData(text);
    handleProcessingResult(processingResult, 'Dados colados', text);
  }, [state, handleProcessingResult]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownload = useCallback(() => {
    if (processedData) {
      const outputFilename = fileName.includes('.') 
        ? fileName.replace(/\.(xlsx|xls)$/i, '_base.xlsx')
        : 'planilha_base.xlsx';
      generateExcelDownload(processedData, outputFilename);
      toast.success('Download iniciado!');
    }
  }, [processedData, fileName]);

  const handleCopyToClipboard = useCallback(async () => {
    if (processedData) {
      const { text, html } = generateClipboardData(processedData, shipName);
      
      try {
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        });
        await navigator.clipboard.write([clipboardItem]);
        toast.success('Tabela copiada! Cole no Excel, Outlook ou e-mail.');
      } catch {
        await navigator.clipboard.writeText(text);
        toast.success('Tabela copiada!');
      }
    }
  }, [processedData, shipName]);

  const handleCopyEmails = useCallback(async (emails: string) => {
    try {
      await navigator.clipboard.writeText(emails);
      toast.success('Emails copiados para a área de transferência!');
    } catch {
      toast.error('Erro ao copiar emails');
    }
  }, []);

  const getDespachanteEmails = useCallback(() => {
    if (!processedData) return '';
    
    const uniqueBrokers = [...new Set(processedData.map(row => row['Customs Broker']).filter(Boolean))];
    const emailsMap = new Map<string, string>();
    
    uniqueBrokers.forEach(broker => {
      const email = findDespachanteEmail(broker);
      if (email) {
        emailsMap.set(broker, email);
      }
    });
    
    if (emailsMap.size === 0) return '';
    
    return Array.from(emailsMap.entries())
      .map(([broker, email]) => `${broker}: ${email}`)
      .join('\n\n');
  }, [processedData]);

  const handleReset = useCallback(() => {
    setState('idle');
    setFileName('');
    setShipName('');
    setResult(null);
    setProcessedData(null);
    setRawEntries([]);
    setGrainRecibos([]);
    setShowReciboPreview(false);
    setCurrentReciboIndex(0);
    setReciboPort('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleTextAreaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;

    if (!text.includes('\t')) {
      toast.error('Os dados colados não parecem ser de uma planilha. Copie células do Excel com Ctrl+C.');
      return;
    }

    e.preventDefault();
    setFileName('Dados colados');
    setState('processing');
    setResult(null);
    setProcessedData(null);
    setRawEntries([]);
    setGrainRecibos([]);

    const processingResult = processPastedData(text);
    handleProcessingResult(processingResult, 'Dados colados', text);
  }, [handleProcessingResult]);

  const handlePrintRecibos = useCallback(() => {
    window.print();
  }, []);

  // Carousel navigation
  const nextRecibo = useCallback(() => {
    setCurrentReciboIndex(prev => (prev + 1) % grainRecibos.length);
  }, [grainRecibos.length]);

  const prevRecibo = useCallback(() => {
    setCurrentReciboIndex(prev => (prev - 1 + grainRecibos.length) % grainRecibos.length);
  }, [grainRecibos.length]);

  return (
    <div className="w-full max-w-4xl mx-auto print:max-w-none print:w-full">
      {/* Card Container */}
      <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden w-full print:hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Ship className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="shipName" className="text-sm font-medium text-foreground">
                  Nome do Navio
                </Label>
                <p className="text-xs text-muted-foreground">Identificação para faturamento e recibos</p>
              </div>
            </div>
            {(shipName || state === 'success' || state === 'error') && (
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
          <Input
            id="shipName"
            type="text"
            value={shipName}
            onChange={(e) => setShipName(e.target.value)}
            className="mt-4 bg-background/80 border-border/50 focus:bg-background"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Paste Area */}
          {(state === 'idle' || state === 'dragging') && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ClipboardPaste className="w-4 h-4 text-primary" />
                  <span>Colar dados da planilha</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Ctrl+V</span>
                </div>
                <div className="relative group">
                  <textarea
                    className={`
                      w-full h-36 p-4 rounded-xl resize-none
                      bg-gradient-to-br from-primary/5 to-primary/10
                      border-2 transition-all duration-300
                      placeholder:text-muted-foreground/50
                      focus:outline-none
                      ${isFocused 
                        ? 'border-primary shadow-lg shadow-primary/10 bg-gradient-to-br from-primary/10 to-primary/15' 
                        : 'border-primary/20 hover:border-primary/40'
                      }
                    `}
                    placeholder="Clique aqui e cole os dados (Ctrl+V)..."
                    onPaste={handleTextAreaPaste}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    readOnly
                  />
                  {isFocused && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-subtle">
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/30" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Copie as células do Excel incluindo os cabeçalhos
                </p>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                </div>
              </div>

              {/* File Upload */}
              <div
                className="group p-4 border border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Upload className="w-4 h-4 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm">Arraste um arquivo ou clique para selecionar</span>
                </div>
              </div>
            </>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <div className="py-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-semibold">Processando...</h3>
              <p className="text-muted-foreground text-sm mt-2">{fileName}</p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && processedData && (
            <div className="py-8 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-success">Processado com sucesso!</h3>
              <p className="text-muted-foreground text-sm mt-2">{fileName}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {processedData.length} para faturamento
                </span>
                {grainRecibos.length > 0 && (
                  <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                    <Printer className="w-4 h-4" />
                    {grainRecibos.length} recibos
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="py-8 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive">Erro no processamento</h3>
              <p className="text-muted-foreground text-sm mt-2">{result?.error}</p>
              {result?.missingColumns && (
                <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-left max-w-sm mx-auto">
                  <p className="text-xs font-medium text-destructive mb-2">Colunas não encontradas:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {result.missingColumns.map(col => (
                      <li key={col} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-destructive" />
                        {col}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Output Tabs - Faturamento & Recibos */}
        {state === 'success' && processedData && (
          <div className="p-6 pt-0 space-y-6">
            <Tabs value={activeOutputTab} onValueChange={(v) => setActiveOutputTab(v as 'faturamento' | 'recibos')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="faturamento" className="gap-2">
                  <Download className="w-4 h-4" />
                  Faturamento
                </TabsTrigger>
                <TabsTrigger value="recibos" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Recibos ({grainRecibos.length})
                </TabsTrigger>
              </TabsList>

              {/* Faturamento Tab */}
              <TabsContent value="faturamento" className="space-y-4 mt-4">
                <div className="flex gap-3 justify-center flex-wrap animate-slide-up">
                  <Button onClick={handleCopyToClipboard} size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Copy className="w-4 h-4" />
                    Copiar Tabela
                  </Button>
                  <Button onClick={handleDownload} size="lg" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Excel
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="lg" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Nova planilha
                  </Button>
                </div>
                
                {/* Emails dos Despachantes */}
                {getDespachanteEmails() && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Emails dos Despachantes</h4>
                      </div>
                      <Button
                        onClick={() => handleCopyEmails(getDespachanteEmails())}
                        size="sm"
                        variant="outline"
                        className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </Button>
                    </div>
                    <div className="text-sm text-blue-800 whitespace-pre-line font-mono bg-white p-3 rounded border">
                      {getDespachanteEmails()}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Recibos Tab */}
              <TabsContent value="recibos" className="space-y-4 mt-4">
                {/* Recibo Config */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3" />
                      Data
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-sm">
                          {reciboDate ? format(reciboDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={reciboDate}
                          onSelect={setReciboDate}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs">
                      <Package className="w-3 h-3" />
                      Carga
                    </Label>
                    <Select value={reciboCargo} onValueChange={(v) => setReciboCargo(v as CargoType)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SBS">SBS</SelectItem>
                        <SelectItem value="SBM">SBM</SelectItem>
                        <SelectItem value="CORN">CORN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3 h-3" />
                      Porto
                    </Label>
                    <Input 
                      value={reciboPort} 
                      onChange={(e) => setReciboPort(e.target.value)}
                      placeholder="Porto de embarque"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Recibo Actions */}
                <div className="flex gap-3 justify-center flex-wrap">
                  {grainRecibos.length > 0 && (
                    <>
                      <Button onClick={() => setShowReciboPreview(!showReciboPreview)} variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {showReciboPreview ? 'Ocultar Preview' : 'Ver Preview'}
                      </Button>
                      <Button onClick={handlePrintRecibos} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir Todos
                      </Button>
                    </>
                  )}
                </div>

                {/* Preview Carousel */}
                {showReciboPreview && grainRecibos.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Preview dos Recibos</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevRecibo}
                            disabled={grainRecibos.length <= 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {currentReciboIndex + 1} de {grainRecibos.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextRecibo}
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
                          date={reciboDate ? format(reciboDate, 'dd/MM/yyyy') : ''}
                          vessel={shipName}
                          cargo={reciboCargo}
                          port={reciboPort}
                          shipper={grainRecibos[currentReciboIndex].shipper}
                          blNumbers={grainRecibos[currentReciboIndex].blNumbers}
                          quantity={grainRecibos[currentReciboIndex].quantity}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Error Reset Button */}
        {state === 'error' && (
          <div className="p-6 pt-0">
            <div className="flex gap-3 justify-center flex-wrap animate-slide-up">
              <Button onClick={handleReset} variant="ghost" size="lg" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden recibos for printing */}
      {grainRecibos.length > 0 && (
        <div className="hidden print:block print:space-y-0">
          {grainRecibos.map((recibo, idx) => (
            <div key={idx} className="print:break-after-page">
              <GrainRecibo
                date={reciboDate ? format(reciboDate, 'dd/MM/yyyy') : ''}
                vessel={shipName}
                cargo={reciboCargo}
                port={reciboPort}
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
