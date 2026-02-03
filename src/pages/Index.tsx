import { useState } from 'react';
import { FileSpreadsheet, FileText, Package } from 'lucide-react';
import { SugarManager } from '@/components/SugarManager';
import { GrainReciboManager } from '@/components/GrainReciboManager';
import { BLManager } from '@/components/BLManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'sugar' | 'grain' | 'bl'>('sugar');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="container py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            {activeTab === 'sugar' && <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />}
            {activeTab === 'grain' && <Package className="w-5 h-5 text-primary-foreground" />}
            {activeTab === 'bl' && <FileText className="w-5 h-5 text-primary-foreground" />}
          </div>
          <div>
            <h1 className="font-bold text-lg">
              {activeTab === 'sugar' && 'Açúcar - Faturamento & Recibos'}
              {activeTab === 'grain' && 'Grãos - Recibos'}
              {activeTab === 'bl' && 'BL Alfândega'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'sugar' && 'Planilha de faturamento e recibos de BLs de açúcar'}
              {activeTab === 'grain' && 'Recibos de grãos (SBS/SBM/CORN)'}
              {activeTab === 'bl' && 'Gerador de Bill of Lading CONGENBILL'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12 print:py-0 print:px-0 print:max-w-none print:w-full">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sugar' | 'grain' | 'bl')} className="space-y-6">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 print:hidden">
            <TabsTrigger value="sugar" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Açúcar
            </TabsTrigger>
            <TabsTrigger value="grain" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Grãos
            </TabsTrigger>
            <TabsTrigger value="bl" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              BL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sugar" className="space-y-8">
            {/* Hero Section */}
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Açúcar - Faturamento & Recibos
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Cole os dados uma vez e gere a planilha de faturamento e os recibos automaticamente.
              </p>
            </section>

            {/* Sugar Manager */}
            <section>
              <SugarManager />
            </section>
          </TabsContent>

          <TabsContent value="grain" className="space-y-8">
            {/* Hero Section */}
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Grãos - Recibos
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Entrada manual de dados para gerar recibos de SBS, SBM e CORN.
              </p>
            </section>

            {/* Grain Recibo Manager */}
            <section>
              <GrainReciboManager />
            </section>
          </TabsContent>

          <TabsContent value="bl" className="space-y-8">
            {/* Hero Section */}
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bill of Lading - CONGENBILL
                  </h2>
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
