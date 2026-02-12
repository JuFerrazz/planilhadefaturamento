import { useState, useCallback, useEffect } from 'react';
import { BLData, Atracacao, createEmptyBL, createEmptyAtracacao, getBLStatus, getPendingFields } from '@/types/bl';
import { BLForm } from './BLForm';
import { BLPreview } from './BLPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Printer, FileText, ChevronLeft, ChevronRight, Anchor, GripVertical, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export const BLManager = () => {
  const [atracaoList, setAtracaoList] = useState<Atracacao[]>([
    createEmptyAtracacao('1', '1ª Atracação')
  ]);
  const [blList, setBlList] = useState<BLData[]>([createEmptyBL('1', '1')]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const activeBL = blList[activeIndex] || blList[0];
  const activeAtracacao = activeBL ? atracaoList.find(a => a.id === activeBL.atracaoId) : atracaoList[0];
  
  // Verifica se o BL atual é o primeiro da sua atracação
  const isFirstOfAtracacao = activeBL ? blList.findIndex(bl => bl.atracaoId === activeBL.atracaoId) === activeIndex : true;

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
    const newAtracaoId = String(Date.now());
    const newAtracacao = createEmptyAtracacao(newAtracaoId, `${atracaoList.length + 1}ª Atracação`);
    
    // Cria um novo BL para a nova atracação
    const newBLId = String(Date.now() + 1);
    const newBL = createEmptyBL(newBLId, newAtracaoId);
    
    // Copia informações globais do primeiro BL
    if (blList.length > 0) {
      const firstBL = blList[0];
      newBL.vessel = firstBL.vessel;
      newBL.portOfLoading = firstBL.portOfLoading;
      newBL.portOfDischarge = firstBL.portOfDischarge;
      newBL.cargoType = firstBL.cargoType;
    }
    
    const newList = [...blList, newBL];
    // Renumera todos globalmente
    newList.forEach((bl, idx) => {
      bl.blNumber = String(idx + 1);
    });
    
    setAtracaoList([...atracaoList, newAtracacao]);
    setBlList(newList);
    setActiveIndex(newList.length - 1);
    
    toast({
      title: "Nova atracação criada",
      description: `${newAtracacao.name} adicionada com BL #${newList.length}.`,
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

  const handleAddBL = useCallback(() => {
    const newId = String(Date.now());
    const currentAtracaoId = activeBL?.atracaoId || atracaoList[0]?.id || '1';
    const newBL = createEmptyBL(newId, currentAtracaoId);
    
    // Copia informações globais do primeiro BL
    if (blList.length > 0) {
      const firstBL = blList[0];
      newBL.vessel = firstBL.vessel;
      newBL.portOfLoading = firstBL.portOfLoading;
      newBL.portOfDischarge = firstBL.portOfDischarge;
      newBL.cargoType = firstBL.cargoType;
    }
    
    // Insere no final do grupo da atracação selecionada
    const newList = [...blList];
    let insertIndex = newList.length;
    
    // Encontra o último BL da atracação atual
    for (let i = newList.length - 1; i >= 0; i--) {
      if (newList[i].atracaoId === currentAtracaoId) {
        insertIndex = i + 1;
        break;
      }
    }
    
    newList.splice(insertIndex, 0, newBL);
    
    // Renumera todos os BLs globalmente
    newList.forEach((bl, idx) => {
      bl.blNumber = String(idx + 1);
    });
    
    setBlList(newList);
    setActiveIndex(insertIndex);
  }, [blList, activeBL, atracaoList]);

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
    
    // Renumera todos os BLs globalmente
    newList.forEach((bl, idx) => {
      bl.blNumber = String(idx + 1);
    });
    
    setBlList(newList);
    
    if (activeIndex >= newList.length) {
      setActiveIndex(newList.length - 1);
    } else if (activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }

    toast({
      title: "Ficha removida",
      description: `Ficha removida com sucesso.`,
    });
  }, [blList, activeIndex]);

  // Name editing handlers
  const handleStartEditName = useCallback((bl: BLData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(bl.id);
    setEditingNameValue(bl.name || '');
  }, []);

  const handleFinishEditName = useCallback(() => {
    if (editingNameId) {
      const newList = blList.map(bl => 
        bl.id === editingNameId ? { ...bl, name: editingNameValue.toUpperCase() } : bl
      );
      setBlList(newList);
    }
    setEditingNameId(null);
    setEditingNameValue('');
  }, [editingNameId, editingNameValue, blList]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditName();
    } else if (e.key === 'Escape') {
      setEditingNameId(null);
      setEditingNameValue('');
    }
  }, [handleFinishEditName]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = '0.4';
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX;
    const elementCenter = rect.left + rect.width / 2;
    const insertPosition = mouseX < elementCenter ? index : index + 1;
    
    // Só atualiza se realmente mudou para evitar re-renders
    setDragOverIndex(prev => prev === insertPosition ? prev : insertPosition);
  }, [draggedIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se saiu do container pai, não de um filho
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (dragOverIndex === draggedIndex || dragOverIndex === draggedIndex + 1) {
      // Não mudou de posição efetivamente
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newList = [...blList];
    const [movedItem] = newList.splice(draggedIndex, 1);
    
    // Ajusta índice de inserção após remoção
    let insertIndex = dragOverIndex > draggedIndex ? dragOverIndex - 1 : dragOverIndex;
    
    // Garante que está dentro dos limites
    insertIndex = Math.max(0, Math.min(insertIndex, newList.length));
    
    // Determina a atracação baseada nos vizinhos
    if (insertIndex > 0 && insertIndex <= newList.length) {
      movedItem.atracaoId = newList[Math.min(insertIndex, newList.length) - 1].atracaoId;
    } else if (newList.length > 0) {
      movedItem.atracaoId = newList[0].atracaoId;
    }
    
    newList.splice(insertIndex, 0, movedItem);
    
    // Renumera
    newList.forEach((bl, idx) => {
      bl.blNumber = String(idx + 1);
    });
    
    setBlList(newList);
    
    // Ajusta índice ativo
    if (activeIndex === draggedIndex) {
      setActiveIndex(insertIndex);
    } else if (activeIndex > draggedIndex && activeIndex <= insertIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex < draggedIndex && activeIndex >= insertIndex) {
      setActiveIndex(activeIndex + 1);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, blList, activeIndex]);

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
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleAddBL} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </div>
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

          {/* BL cards com drag and drop e separadores de atracação */}
           <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e)}>
              {blList.map((bl, idx) => {
                const atr = atracaoList.find(a => a.id === bl.atracaoId);
                const status = getBLStatus(bl, atr);
                const pendingCount = getPendingFields(bl, atr).length;
                const isActive = idx === activeIndex;
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;
                
                // Verifica se precisa de separador antes deste BL
                const needsSeparator = idx > 0 && blList[idx - 1].atracaoId !== bl.atracaoId;
                
                return (
                  <div key={bl.id} className="flex items-center">
                    {/* Separador entre atracações - com drag handlers para não quebrar o drag */}
                    {needsSeparator && (
                      <div 
                        className="flex items-center mx-3"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Ao passar pelo separador, define inserção no idx atual (início do próximo grupo)
                          if (draggedIndex !== null && draggedIndex !== idx) {
                            setDragOverIndex(idx);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedIndex !== null && dragOverIndex !== null) {
                            handleDrop(e);
                          }
                        }}
                      >
                        <div className="w-px h-12 bg-border/50" />
                      </div>
                    )}
                    
                    {/* Indicador de inserção - seta única entre os cards */}
                    {dragOverIndex === idx && draggedIndex !== null && draggedIndex !== idx && draggedIndex !== idx - 1 && (
                      <div className="flex flex-col items-center z-10 self-start mt-1 mx-[-4px]">
                        <div
                          className="w-0 h-0 animate-pulse"
                          style={{
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderTop: '9px solid hsl(var(--primary))',
                          }}
                        />
                      </div>
                    )}
                    
                    <div
                      draggable={blList.length > 1}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e)}
                      className={`
                        group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                        ${isActive 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card hover:bg-muted border-border'
                        }
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${blList.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}
                      `}
                      onClick={() => setActiveIndex(idx)}
                      title={blList.length > 1 ? "Arraste para reordenar" : ""}
                    >
                      {/* Drag handle */}
                      {blList.length > 1 && (
                        <div className={`flex items-center ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <GripVertical className="w-3 h-3" />
                        </div>
                      )}
                      
                      {/* Nome editável + número sequencial */}
                      {editingNameId === bl.id ? (
                        <Input
                          autoFocus
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={handleFinishEditName}
                          onKeyDown={handleNameKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-24 text-xs font-medium uppercase px-1 py-0 text-foreground bg-background"
                          placeholder="Nome"
                        />
                      ) : (
                        <span 
                          className="font-medium whitespace-nowrap flex items-center gap-1"
                          onDoubleClick={(e) => handleStartEditName(bl, e)}
                        >
                          {bl.name ? `${bl.name}#${bl.blNumber || idx + 1}` : `BL#${bl.blNumber || idx + 1}`}
                          <Pencil 
                            className={`w-2.5 h-2.5 opacity-0 group-hover:opacity-100 cursor-pointer ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                            onClick={(e) => handleStartEditName(bl, e)}
                          />
                        </span>
                      )}
                      <Badge 
                        variant={status === 'complete' ? 'default' : 'secondary'}
                        className={`text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                      >
                        {status === 'complete' ? '✓' : pendingCount}
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
                          title="Remover BL"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Seta após o último item */}
                    {idx === blList.length - 1 && dragOverIndex === idx + 1 && draggedIndex !== null && draggedIndex !== idx && (
                      <div className="flex flex-col items-center z-10 self-start mt-1 mx-[-4px]">
                        <div
                          className="w-0 h-0 animate-pulse"
                          style={{
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderTop: '9px solid hsl(var(--primary))',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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
              <CardTitle>Editar {activeBL.name ? `${activeBL.name}#${activeBL.blNumber || activeIndex + 1}` : `BL#${activeBL.blNumber || activeIndex + 1}`}</CardTitle>
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
              <CardTitle>Pré-visualização - {activeBL.name ? `${activeBL.name}#${activeBL.blNumber || activeIndex + 1}` : `BL#${activeBL.blNumber || activeIndex + 1}`}</CardTitle>
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
