import { useCallback, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { parseDUEPdf, ParsedDUEData } from '@/lib/pdfParser';
import { cn } from '@/lib/utils';

interface PdfDropZoneProps {
  onDataExtracted: (data: ParsedDUEData) => void;
}

export const PdfDropZone = ({ onDataExtracted }: PdfDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor, arraste um arquivo PDF');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await parseDUEPdf(file);
      
      if (data) {
        onDataExtracted(data);
      } else {
        setError('Não foi possível extrair dados do PDF');
      }
    } catch (err) {
      setError('Erro ao processar o PDF');
    } finally {
      setIsProcessing(false);
    }
  }, [onDataExtracted]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        isDragging 
          ? "border-primary bg-primary/10" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        isProcessing && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        {isProcessing ? (
          <>
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Processando PDF...</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <Upload className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">
              Arraste o PDF da DU-E aqui
            </span>
            {error && (
              <span className="text-sm text-destructive">{error}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
