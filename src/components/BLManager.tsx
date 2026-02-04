import { useState, useCallback, useEffect } from 'react';
import { BLData, Atracacao, createEmptyBL, createEmptyAtracacao, getBLStatus, getPendingFields } from '@/types/bl';
import { BLForm } from './BLForm';
import { BLPreview } from './BLPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Printer, FileText, ChevronLeft, ChevronRight, Anchor, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const BLManager = () => {
  const [atracaoList, setAtracaoList] = useState<Atracacao[]>([
    createEmptyAtracacao('1', '1ª Atracação')
  ]);
  const [blList, setBlList] = useState<BLData[]>([createEmptyBL('1', '1')]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeBL = blList[activeIndex];
  const activeAtracacao = atracaoList.find(a => a.id === activeBL.atracaoId);
  
  // Verifica se o BL atual é o primeiro da sua atracação
  const isFirstOfAtracacao = blList.findIndex(bl => bl.atracaoId === activeBL.atracaoId) === activeIndex;

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
    const newAtracaoId = String(atracaoList.length + 1);
    const newAtracacao = createEmptyAtracacao(newAtracaoId, `${atracaoList.length + 1}ª Atracação`);
    
    // Cria um novo BL para a nova atracação
    const newBLId = String(blList.length + 1);
    const newBL = createEmptyBL(newBLId, newAtracaoId);
    newBL.blNumber = newBLId; // Numeração sequencial independente da atracação
    
    // Copia informações globais do primeiro BL
    if (blList.length > 0) {
      const firstBL = blList[0];
      newBL.vessel = firstBL.vessel;
      newBL.portOfLoading = firstBL.portOfLoading;
      newBL.portOfDischarge = firstBL.portOfDischarge;
      newBL.cargoType = firstBL.cargoType;
    }
    
    setAtracaoList([...atracaoList, newAtracacao]);
    setBlList([...blList, newBL]);
    setActiveIndex(blList.length); // Navega para o novo BL
    
    toast({
      title: "Nova atracação criada",
      description: `${newAtracacao.name} adicionada com BL #1.`,
    });
  }, [atracaoList, blList]);

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

  // Removido handleAddBL - agora cada atracação tem seu próprio botão inline

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

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Para compatibilidade
    
    // Adiciona uma classe visual ao elemento sendo arrastado
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number, targetAtracaoId: string) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedItem = blList[draggedIndex];
    
    // Só permite drop dentro da mesma atracação
    if (draggedItem.atracaoId !== targetAtracaoId) {
      toast({
        title: "Movimento não permitido",
        description: "BLs só podem ser reordenados dentro da mesma atracação.",
        variant: "destructive",
      });
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newList = [...blList];
    
    // Remove o item da posição original
    newList.splice(draggedIndex, 1);
    
    // Ajusta o índice de drop se necessário
    const adjustedDropIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
    
    // Insere na nova posição
    newList.splice(adjustedDropIndex, 0, draggedItem);
    
    // Renumera todos os BLs para refletir a nova ordem
    newList.forEach((bl, idx) => {
      bl.blNumber = String(idx + 1);
    });
    
    setBlList(newList);
    
    // Ajusta o índice ativo para seguir o BL movido
    if (activeIndex === draggedIndex) {
      setActiveIndex(adjustedDropIndex);
    } else if (activeIndex > draggedIndex && activeIndex <= adjustedDropIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex < draggedIndex && activeIndex >= adjustedDropIndex) {
      setActiveIndex(activeIndex + 1);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, blList, activeIndex]);

  const handleUpdateBL = useCallback((data: BLData) => {
    const newList = [...blList];
    newList[activeIndex] = data;
    
    // Se estamos editando o BL #1, propaga as mudanças globais para todos os outros
    if (data.blNumber === '1') {
      for (let i = 1; i < newList.length; i++) {
        // Vessel & Ports (global)
        newList[i].vessel = data.vessel;
        newList[i].portOfLoading = data.portOfLoading;
        newList[i].portOfDischarge = data.portOfDischarge;
        // Tipo de carga (global)
        newList[i].cargoType = data.cargoType;
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
      {/* BL List Navigation with Atracação inline */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichas BL ({blList.length})
            </CardTitle>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Atracações inline bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Anchor className="w-3 h-3" />
              Atracações:
            </span>
            {atracaoList.map((atr) => {
              const blCount = blList.filter(bl => bl.atracaoId === atr.id).length;
              const isActive = activeBL.atracaoId === atr.id;
              
              return (
                <Badge
                  key={atr.id}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => {
                    const firstBLIndex = blList.findIndex(bl => bl.atracaoId === atr.id);
                    if (firstBLIndex >= 0) {
                      setActiveIndex(firstBLIndex);
                    }
                  }}
                >
                  {atr.name}
                  {atr.issueDate && (
                    <span className="text-xs opacity-70">
                      ({format(atr.issueDate, "dd/MM")})
                    </span>
                  )}
                  <span className="text-xs opacity-70">• {blCount}</span>
                  {atracaoList.length > 1 && blCount === 0 && (
                    <Trash2
                      className="w-3 h-3 ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAtracacao(atr.id);
                      }}
                    />
                  )}
                </Badge>
              );
            })}
            <Button onClick={handleAddAtracacao} size="sm" variant="ghost" className="h-6 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Nova
            </Button>
          </div>

          {/* BL cards agrupados por atracação */}
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-2">
              {blsByAtracacao.map((group, groupIdx) => (
                <div key={group.atracacao.id} className="flex flex-col gap-2">
                  {/* Header da atracação */}
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-t-md border-b">
                    <Anchor className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {group.atracacao.name}
                    </span>
                    {group.atracacao.issueDate && (
                      <span className="text-xs text-muted-foreground/70">
                        ({format(group.atracacao.issueDate, "dd/MM")})
                      </span>
                    )}
                  </div>
                  
                  {/* BLs desta atracação */}
                  <div className="flex gap-2 px-1">
                    {group.bls.map(({ bl, idx }) => {
                      const status = getBLStatus(bl, group.atracacao);
                      const pendingCount = getPendingFields(bl, group.atracacao).length;
                      const isActive = idx === activeIndex;
                      const isDragging = draggedIndex === idx;
                      const isDragOver = dragOverIndex === idx;
                      
                      return (
                        <div
                          key={bl.id}
                          draggable={blList.length > 1}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, idx, group.atracacao.id)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                            ${isActive 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-card hover:bg-muted border-border'
                            }
                            ${isDragging ? 'opacity-50 scale-95' : ''}
                            ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}
                            ${blList.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}
                          `}
                          onClick={() => setActiveIndex(idx)}
                          title={blList.length > 1 ? "Arraste para reordenar dentro da atracação" : ""}
                        >
                          {/* Drag handle */}
                          {blList.length > 1 && (
                            <div className={`flex items-center ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              <GripVertical className="w-3 h-3" />
                            </div>
                          )}
                          
                          <span className="font-medium whitespace-nowrap">
                            BL #{bl.blNumber || idx + 1}
                          </span>
                          <Badge 
                            variant={status === 'complete' ? 'default' : 'secondary'}
                            className={`text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                          >
                            {status === 'complete' ? '✓' : pendingCount}
                          </Badge>
                          
                          {group.bls.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 ${isActive ? 'hover:bg-primary-foreground/20' : 'hover:bg-destructive/10 hover:text-destructive'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBL(idx);
                              }}
                              title="Remover BL"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Botão para adicionar BL nesta atracação */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-2 px-2 border border-dashed"
                      onClick={() => {
                        const newId = String(blList.length + 1);
                        const newBL = createEmptyBL(newId, group.atracacao.id);
                        newBL.blNumber = newId;
                        
                        if (blList.length > 0) {
                          const firstBL = blList[0];
                          newBL.vessel = firstBL.vessel;
                          newBL.portOfLoading = firstBL.portOfLoading;
                          newBL.portOfDischarge = firstBL.portOfDischarge;
                          newBL.cargoType = firstBL.cargoType;
                        }
                        
                        // Insere o BL no final do grupo da atracação
                        const lastIdxOfGroup = group.bls.length > 0 
                          ? group.bls[group.bls.length - 1].idx + 1 
                          : blList.findIndex(bl => bl.atracaoId > group.atracacao.id);
                        
                        const insertIdx = lastIdxOfGroup >= 0 ? lastIdxOfGroup : blList.length;
                        const newList = [...blList];
                        newList.splice(insertIdx, 0, newBL);
                        
                        // Renumera
                        newList.forEach((bl, i) => {
                          bl.blNumber = String(i + 1);
                        });
                        
                        setBlList(newList);
                        setActiveIndex(insertIdx);
                        
                        toast({
                          title: "Nova ficha criada",
                          description: `BL #${newBL.blNumber} adicionado na ${group.atracacao.name}.`,
                        });
                      }}
                      title={`Adicionar BL na ${group.atracacao.name}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4">
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
                isFirstOfAtracacao={isFirstOfAtracacao}
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
