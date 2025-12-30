import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { BLManager } from '@/components/BLManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'faturamento' | 'bl'>('faturamento');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            {activeTab === 'faturamento' ? (
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            ) : (
              <FileText className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg">
              {activeTab === 'faturamento' ? 'Planilha de Faturamento APS' : 'BL Alfândega'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'faturamento' 
                ? 'Conversor de planilha APS' 
                : 'Gerador de Bill of Lading CONGENBILL'
              }
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12 print:py-0 print:px-0">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'faturamento' | 'bl')} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 print:hidden">
            <TabsTrigger value="faturamento" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Faturamento
            </TabsTrigger>
            <TabsTrigger value="bl" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              BL Alfândega
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faturamento" className="space-y-8">
            {/* Hero Section */}
            <section className="text-center animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Automação de Faturamento
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Cole os dados da planilha Excel e gere automaticamente o relatório padronizado.
              </p>
            </section>

            {/* Upload Section */}
            <section>
              <FileUploader />
            </section>
          </TabsContent>

          <TabsContent value="bl" className="space-y-8">
            {/* Hero Section */}
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bill of Lading - CONGENBILL
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Preencha as fichas de BL no formato oficial da Receita Federal. Use Ctrl+P para imprimir.
              </p>
            </section>

            {/* BL Manager */}
            <section>
              <BLManager />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
