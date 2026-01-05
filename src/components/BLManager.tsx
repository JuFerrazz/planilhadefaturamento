import { useState, useCallback, useEffect } from 'react';
import { BLData, Atracacao, createEmptyBL, createEmptyAtracacao, getBLStatus, getPendingFields } from '@/types/bl';
import { BLForm } from './BLForm';
import { BLPreview } from './BLPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Printer, FileText, ChevronLeft, ChevronRight, Anchor } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const BLManager = () => {
  const [atracaoList, setAtracaoList] = useState<Atracacao[]>([
    createEmptyAtracacao('1', '1ª Atracação')
  ]);
  const [blList, setBlList] = useState<BLData[]>([createEmptyBL('1', '1')]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const activeBL = blList[activeIndex];
  const activeAtracacao = atracaoList.find(a => a.id === activeBL.atracaoId);

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

  const handleAddAtracacao = useCallback(() => {
    const newId = String(atracaoList.length + 1);
    const newAtracacao = createEmptyAtracacao(newId, `${atracaoList.length + 1}ª Atracação`);
    setAtracaoList([...atracaoList, newAtracacao]);
    toast({
      title: "Nova atracação criada",
      description: `${newAtracacao.name} adicionada. Agora você pode associar BLs a ela.`,
    });
  }, [atracaoList]);

  const handleUpdateAtracacao = useCallback((updated: Atracacao) => {
    setAtracaoList(atracaoList.map(a => a.id === updated.id ? updated : a));
  }, [atracaoList]);

  const handleRemoveAtracacao = useCallback((id: string) => {
    if (atracaoList.length === 1) {
      toast({
        title: "Não é possível remover",
        description: "É necessário ter pelo menos uma atracação.",
        variant: "destructive",
      });
      return;
    }

    // Check if any BL is using this atracacao
    const blsUsingAtracacao = blList.filter(bl => bl.atracaoId === id);
    if (blsUsingAtracacao.length > 0) {
      toast({
        title: "Não é possível remover",
        description: `Esta atracação possui ${blsUsingAtracacao.length} BL(s) associado(s). Mova os BLs para outra atracação primeiro.`,
        variant: "destructive",
      });
      return;
    }

    setAtracaoList(atracaoList.filter(a => a.id !== id));
    toast({
      title: "Atracação removida",
      description: "A atracação foi removida com sucesso.",
    });
  }, [atracaoList, blList]);

  const handleAddBL = useCallback(() => {
    const newId = String(blList.length + 1);
    const newBL = createEmptyBL(newId, activeBL.atracaoId);
    newBL.blNumber = newId;
    
    // Copia informações de Vessel & Ports do primeiro BL
    if (blList.length > 0) {
      const firstBL = blList[0];
      newBL.vessel = firstBL.vessel;
      newBL.portOfLoading = firstBL.portOfLoading;
      newBL.portOfDischarge = firstBL.portOfDischarge;
    }
    
    setBlList([...blList, newBL]);
    setActiveIndex(blList.length);
    toast({
      title: "Nova ficha criada",
      description: `Ficha BL #${newId} adicionada na ${activeAtracacao?.name || 'atracação atual'}.`,
    });
  }, [blList, activeBL.atracaoId, activeAtracacao]);

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
    
    // Se estamos editando o BL #1, propaga as mudanças de Vessel & Ports para todos os outros
    if (data.blNumber === '1') {
      for (let i = 1; i < newList.length; i++) {
        newList[i].vessel = data.vessel;
        newList[i].portOfLoading = data.portOfLoading;
        newList[i].portOfDischarge = data.portOfDischarge;
      }
    }
    
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

  // Group BLs by atracacao for display
  const blsByAtracacao = atracaoList.map(atr => ({
    atracacao: atr,
    bls: blList.map((bl, idx) => ({ bl, idx })).filter(({ bl }) => bl.atracaoId === atr.id)
  }));

  return (
    <div className="space-y-6">
      {/* Atracação Management */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Anchor className="w-5 h-5" />
              Atracações ({atracaoList.length})
            </CardTitle>
            <Button onClick={handleAddAtracacao} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Atracação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {atracaoList.map((atr) => {
                const blCount = blList.filter(bl => bl.atracaoId === atr.id).length;
                const isActive = activeBL.atracaoId === atr.id;
                
                return (
                  <div
                    key={atr.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                      ${isActive 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card hover:bg-muted border-border'
                      }
                    `}
                    onClick={() => {
                      // Switch to first BL of this atracacao if any
                      const firstBLIndex = blList.findIndex(bl => bl.atracaoId === atr.id);
                      if (firstBLIndex >= 0) {
                        setActiveIndex(firstBLIndex);
                      }
                    }}
                  >
                    <Anchor className="w-4 h-4" />
                    <span className="font-medium whitespace-nowrap">
                      {atr.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {blCount} BL{blCount !== 1 ? 's' : ''}
                    </Badge>
                    {atr.issueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(atr.issueDate, "dd/MM")}
                      </span>
                    )}
                    {atracaoList.length > 1 && blCount === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAtracacao(atr.id);
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
        </CardContent>
      </Card>

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
          <div className="space-y-4">
            {blsByAtracacao.map(({ atracacao, bls }) => (
              bls.length > 0 && (
                <div key={atracacao.id}>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <Anchor className="w-3 h-3" />
                    {atracacao.name}
                    {atracacao.issueDate && (
                      <span>({format(atracacao.issueDate, "dd/MM/yyyy")})</span>
                    )}
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {bls.map(({ bl, idx }) => {
                        const status = getBLStatus(bl, atracacao);
                        const pendingCount = getPendingFields(bl, atracacao).length;
                        const isActive = idx === activeIndex;
                        
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
                            onClick={() => setActiveIndex(idx)}
                          >
                            <span className="font-medium whitespace-nowrap">
                              BL #{bl.blNumber || idx + 1}
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
                                  handleRemoveBL(idx);
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
                </div>
              )
            ))}
          </div>
          
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
              <BLForm 
                data={activeBL} 
                onChange={handleUpdateBL}
                atracacao={activeAtracacao}
                onAtracaoChange={handleUpdateAtracacao}
                atracaoList={atracaoList}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização - BL #{activeBL.blNumber || activeIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <BLPreview data={activeBL} atracacao={activeAtracacao} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print-only content */}
      <div className="hidden print:block print:w-full print:h-full print:m-0 print:p-0">
        <BLPreview data={activeBL} atracacao={activeAtracacao} />
      </div>
    </div>
  );
};
