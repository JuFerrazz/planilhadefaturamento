import { useState, useCallback, useEffect } from 'react';
import { BLData, createEmptyBL, getBLStatus, getPendingFields } from '@/types/bl';
import { BLForm } from './BLForm';
import { BLPreview } from './BLPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Printer, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const BLManager = () => {
  const [blList, setBlList] = useState<BLData[]>([createEmptyBL('1')]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const activeBL = blList[activeIndex];

  // Keyboard shortcut for print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handleAddBL = useCallback(() => {
    const newId = String(blList.length + 1);
    const newBL = createEmptyBL(newId);
    newBL.blNumber = newId;
    setBlList([...blList, newBL]);
    setActiveIndex(blList.length);
    toast({
      title: "Nova ficha criada",
      description: `Ficha BL #${newId} adicionada.`,
    });
  }, [blList]);

  const handleRemoveBL = useCallback((index: number) => {
    if (blList.length === 1) {
      toast({
        title: "Não é possível remover",
        description: "É necessário ter pelo menos uma ficha.",
        variant: "destructive",
      });
      return;
    }

    const newList = blList.filter((_, i) => i !== index);
    setBlList(newList);
    
    if (activeIndex >= newList.length) {
      setActiveIndex(newList.length - 1);
    } else if (activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }

    toast({
      title: "Ficha removida",
      description: `Ficha #${index + 1} foi removida.`,
    });
  }, [blList, activeIndex]);

  const handleUpdateBL = useCallback((data: BLData) => {
    const newList = [...blList];
    newList[activeIndex] = data;
    setBlList(newList);
  }, [blList, activeIndex]);

  const handlePrint = useCallback(() => {
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 300);
  }, []);

  const navigatePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const navigateNext = () => {
    if (activeIndex < blList.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* BL List Navigation */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichas BL ({blList.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir (Ctrl+P)
              </Button>
              <Button onClick={handleAddBL} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {blList.map((bl, index) => {
                const status = getBLStatus(bl);
                const pendingCount = getPendingFields(bl).length;
                const isActive = index === activeIndex;
                
                return (
                  <div
                    key={bl.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                      ${isActive 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card hover:bg-muted border-border'
                      }
                    `}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="font-medium whitespace-nowrap">
                      BL #{bl.blNumber || index + 1}
                    </span>
                    <Badge 
                      variant={status === 'complete' ? 'default' : 'secondary'}
                      className={`text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                    >
                      {status === 'complete' ? 'Completo' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
                    </Badge>
                    {blList.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${isActive ? 'hover:bg-primary-foreground/20' : 'hover:bg-destructive/10 hover:text-destructive'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBL(index);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrev}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {activeIndex + 1} de {blList.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              disabled={activeIndex === blList.length - 1}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form / Preview Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'form' | 'preview')} className="print:hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Formulário</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Editar BL #{activeBL.blNumber || activeIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <BLForm data={activeBL} onChange={handleUpdateBL} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização - BL #{activeBL.blNumber || activeIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <BLPreview data={activeBL} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print-only content */}
      <div className="hidden print:block">
        <BLPreview data={activeBL} />
      </div>
    </div>
  );
};
