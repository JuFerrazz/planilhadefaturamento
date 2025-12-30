import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, Download, RefreshCw, ClipboardPaste, Copy, Ship, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processExcelFile, generateExcelDownload, processPastedData, generateClipboardData, ProcessingResult, OutputRow } from '@/lib/excelProcessor';
import { toast } from 'sonner';

type UploadState = 'idle' | 'dragging' | 'processing' | 'success' | 'error';

export function FileUploader() {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [shipName, setShipName] = useState<string>('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processedData, setProcessedData] = useState<OutputRow[] | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessingResult = useCallback((processingResult: ProcessingResult, sourceName: string) => {
    setResult(processingResult);

    if (processingResult.success && processingResult.data) {
      setProcessedData(processingResult.data);
      setState('success');
      toast.success(`Dados processados com sucesso! ${processingResult.data.length} registros encontrados.`);
    } else {
      setState('error');
      toast.error(processingResult.error || 'Erro ao processar dados');
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setFileName(file.name);
    setState('processing');
    setResult(null);
    setProcessedData(null);

    const processingResult = await processExcelFile(file);
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

    const processingResult = processPastedData(text);
    handleProcessingResult(processingResult, 'Dados colados');
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

  const handleReset = useCallback(() => {
    setState('idle');
    setFileName('');
    setShipName('');
    setResult(null);
    setProcessedData(null);
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

    const processingResult = processPastedData(text);
    handleProcessingResult(processingResult, 'Dados colados');
  }, [handleProcessingResult]);

  return (
    <div className="w-full">
      {/* Card Container */}
      <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden w-full">
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
                <p className="text-xs text-muted-foreground">Identificação para o relatório</p>
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
              <div className="mt-3 inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                {processedData.length} registros processados
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

        {/* Action Buttons */}
        {(state === 'success' || state === 'error') && (
          <div className="p-6 pt-0">
            <div className="flex gap-3 justify-center flex-wrap animate-slide-up">
              {state === 'success' && (
                <>
                  <Button onClick={handleCopyToClipboard} size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Copy className="w-4 h-4" />
                    Copiar Tabela
                  </Button>
                  <Button onClick={handleDownload} size="lg" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Excel
                  </Button>
                </>
              )}
              <Button onClick={handleReset} variant="ghost" size="lg" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {state === 'error' ? 'Tentar novamente' : 'Nova planilha'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
