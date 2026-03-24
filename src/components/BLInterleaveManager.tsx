import { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileText, Upload, Printer, X, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PdfFile {
  file: File;
  pageCount: number;
}

export const BLInterleaveManager = () => {
  const [frontPdf, setFrontPdf] = useState<PdfFile | null>(null);
  const [backPdf, setBackPdf] = useState<PdfFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPdf = useCallback(async (file: File): Promise<PdfFile | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      return { file, pageCount: pdf.getPageCount() };
    } catch {
      toast({
        title: 'Erro',
        description: `Não foi possível ler o arquivo "${file.name}"`,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const handleFileDrop = useCallback(
    (type: 'front' | 'back') => async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Erro', description: 'Apenas arquivos PDF são aceitos', variant: 'destructive' });
        return;
      }
      const loaded = await loadPdf(file);
      if (loaded) {
        if (type === 'front') setFrontPdf(loaded);
        else setBackPdf(loaded);
      }
    },
    [loadPdf, toast]
  );

  const handlePrint = useCallback(async () => {
    if (!frontPdf || !backPdf) return;

    const isSingleBack = backPdf.pageCount === 1;

    if (!isSingleBack && frontPdf.pageCount !== backPdf.pageCount) {
      toast({
        title: 'Erro',
        description: `Os PDFs têm quantidades diferentes de páginas (Frentes: ${frontPdf.pageCount}, Versos: ${backPdf.pageCount})`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const frontBuffer = await frontPdf.file.arrayBuffer();
      const backBuffer = await backPdf.file.arrayBuffer();

      const frontDoc = await PDFDocument.load(frontBuffer);
      const backDoc = await PDFDocument.load(backBuffer);
      const mergedDoc = await PDFDocument.create();

      const backPageIndex = isSingleBack ? 0 : -1;

      for (let i = 0; i < frontDoc.getPageCount(); i++) {
        const [frontPage] = await mergedDoc.copyPages(frontDoc, [i]);
        mergedDoc.addPage(frontPage);

        const [backPage] = await mergedDoc.copyPages(backDoc, [isSingleBack ? backPageIndex : i]);
        mergedDoc.addPage(backPage);
      }

      const mergedBytes = await mergedDoc.save();
      const blob = new Blob([mergedBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Use iframe to avoid popup blockers
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.addEventListener('load', () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 500);
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 120000);
      });

      toast({ title: 'Sucesso', description: 'PDF intercalado enviado para impressão' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao processar os PDFs', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [frontPdf, backPdf, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Intercalar Frente & Verso dos BLs
        </CardTitle>
        <CardDescription>
          Faça upload do PDF das frentes e do PDF dos versos. O sistema intercala automaticamente e envia para impressão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DropZone
            label="Frentes dos BLs"
            file={frontPdf}
            onFile={handleFileDrop('front')}
            onClear={() => setFrontPdf(null)}
          />
          <DropZone
            label="Versos dos BLs"
            file={backPdf}
            onFile={handleFileDrop('back')}
            onClear={() => setBackPdf(null)}
          />
        </div>

        {frontPdf && backPdf && backPdf.pageCount !== 1 && frontPdf.pageCount !== backPdf.pageCount && (
          <p className="text-sm text-destructive text-center">
            ⚠️ Frentes ({frontPdf.pageCount} páginas) e Versos ({backPdf.pageCount} páginas) têm quantidades diferentes.
          </p>
        )}

        <Button
          onClick={handlePrint}
          disabled={!frontPdf || !backPdf || isProcessing || (backPdf?.pageCount !== 1 && frontPdf?.pageCount !== backPdf?.pageCount)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Processando...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              Imprimir BLs Intercalados
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

interface DropZoneProps {
  label: string;
  file: PdfFile | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

const DropZone = ({ label, file, onFile, onClear }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (file) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.file.name}</p>
            <p className="text-xs text-muted-foreground">{file.pageCount} página(s)</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <Upload className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">Arraste ou clique para selecionar</span>
        </div>
      </div>
    </>
  );
};
