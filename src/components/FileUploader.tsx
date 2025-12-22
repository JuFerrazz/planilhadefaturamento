import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download, RefreshCw, ClipboardPaste, Copy, Ship, Trash2 } from 'lucide-react';
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

    // Check if it looks like tabular data (has tabs)
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
        // Use ClipboardItem API to copy both text and HTML formats
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        });
        await navigator.clipboard.write([clipboardItem]);
        toast.success('Tabela copiada! Cole no Excel, Outlook ou e-mail.');
      } catch {
        // Fallback to text-only copy
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

  const getZoneClass = () => {
    const base = 'upload-zone';
    switch (state) {
      case 'dragging': return `${base} dragging`;
      case 'processing': return `${base} processing`;
      case 'success': return `${base} success`;
      case 'error': return `${base} error`;
      default: return base;
    }
  };

  const handleTextAreaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;

    // Check if it looks like tabular data (has tabs)
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Ship Name Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="shipName" className="flex items-center gap-2">
            <Ship className="w-4 h-4" />
            Nome do Navio
          </Label>
          {(shipName || state === 'success' || state === 'error') && (
            <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>
        <Input
          id="shipName"
          type="text"
          placeholder="Digite o nome do navio..."
          value={shipName}
          onChange={(e) => setShipName(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Main Paste Area */}
      {(state === 'idle' || state === 'dragging') && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4" />
            Cole os dados da planilha aqui
          </Label>
          <textarea
            className="w-full h-40 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Selecione as células no Excel e cole aqui (Ctrl+V)..."
            onPaste={handleTextAreaPaste}
            readOnly
          />
          <p className="text-xs text-muted-foreground text-center">
            Copie as células do Excel incluindo os cabeçalhos e cole acima
          </p>
        </div>
      )}

      {/* Secondary: File Upload */}
      {(state === 'idle' || state === 'dragging') && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>
      )}

      {(state === 'idle' || state === 'dragging') && (
        <div
          className="p-4 border border-dashed border-muted-foreground/30 rounded-lg hover:border-muted-foreground/50 transition-colors cursor-pointer text-center"
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
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Upload className="w-5 h-5" />
            <span className="text-sm">Arraste um arquivo Excel ou clique para selecionar</span>
          </div>
        </div>
      )}

      {/* Processing State */}
      {state === 'processing' && (
        <div className="upload-zone processing animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <h3 className="text-lg font-semibold">Processando...</h3>
          <p className="text-muted-foreground text-sm mt-2">{fileName}</p>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && processedData && (
        <div className="upload-zone success animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-success">Processado com sucesso!</h3>
          <p className="text-muted-foreground text-sm mt-2">{fileName}</p>
          <p className="text-sm mt-1">
            <span className="font-medium">{processedData.length}</span> registros processados
          </p>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="upload-zone error animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Erro no processamento</h3>
          <p className="text-muted-foreground text-sm mt-2">{result?.error}</p>
          {result?.missingColumns && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-left">
              <p className="text-xs font-medium text-destructive mb-1">Colunas não encontradas:</p>
              <ul className="text-xs text-muted-foreground">
                {result.missingColumns.map(col => (
                  <li key={col}>• {col}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(state === 'success' || state === 'error') && (
        <div className="flex gap-3 justify-center mt-6 animate-slide-up flex-wrap">
          {state === 'success' && (
            <>
              <Button onClick={handleCopyToClipboard} size="lg" className="gap-2">
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
      )}
    </div>
  );
}
