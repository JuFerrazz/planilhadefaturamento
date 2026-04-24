import { useState } from 'react';
import { FileSpreadsheet, FileText, Package, Printer, Receipt } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SugarManager } from '@/components/SugarManager';
import { GrainReciboManager } from '@/components/GrainReciboManager';
import { TrampReciboManager } from '@/components/TrampReciboManager';
import { BLManager } from '@/components/BLManager';
import { BLInterleaveManager } from '@/components/BLInterleaveManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MainTab = 'sugar' | 'recibos' | 'bl' | 'interleave';
type ReciboSubTab = 'grain' | 'tramp' | 'g2';

const Index = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('recibos');
  const [reciboSubTab, setReciboSubTab] = useState<ReciboSubTab>('grain');

  const headerTitle = (() => {
    if (activeTab === 'sugar') return 'Açúcar - Faturamento & Recibos';
    if (activeTab === 'recibos') {
      if (reciboSubTab === 'grain') return 'Recibos';
      if (reciboSubTab === 'tramp') return 'Recibos - TRAMP';
      return 'Recibos - G2';
    }
    if (activeTab === 'bl') return 'BL Alfândega';
    return 'Emissão de BLs';
  })();

  const headerSubtitle = (() => {
    if (activeTab === 'sugar') return 'Planilha de faturamento e recibos de BLs de açúcar';
    if (activeTab === 'recibos') {
      if (reciboSubTab === 'grain') return 'Recibos de grãos';
      if (reciboSubTab === 'tramp') return 'Recibos TRAMP (logo Rochamar)';
      return 'Recibos G2 (logo Sagres)';
    }
    if (activeTab === 'bl') return 'Gerador de Bill of Lading CONGENBILL';
    return 'Intercalar e emitir BLs para impressão';
  })();

  const HeaderIcon = (() => {
    if (activeTab === 'sugar') return FileSpreadsheet;
    if (activeTab === 'recibos') return Receipt;
    if (activeTab === 'bl') return FileText;
    return Printer;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <HeaderIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{headerTitle}</h1>
            <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12 print:py-0 print:px-0 print:max-w-none print:w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MainTab)} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recibos" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Recibos
              </TabsTrigger>
              <TabsTrigger value="sugar" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Açúcar
              </TabsTrigger>
              <TabsTrigger value="interleave" className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Emissão
              </TabsTrigger>
            </TabsList>
            <Separator orientation="vertical" className="hidden sm:block h-8" />
            <Separator orientation="horizontal" className="block sm:hidden w-16" />
            <TabsList className="grid w-full sm:w-auto grid-cols-1">
              <TabsTrigger value="bl" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                BL
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sugar" className="space-y-8">
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Açúcar - Faturamento & Recibos
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Cole os dados uma vez e gere a planilha de faturamento e os recibos automaticamente.
              </p>
            </section>
            <section>
              <SugarManager />
            </section>
          </TabsContent>

          <TabsContent value="recibos" className="space-y-6">
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Recibos
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Selecione o tipo de recibo: Grãos ou TRAMP/G2.
              </p>
            </section>

            <Tabs value={reciboSubTab} onValueChange={(v) => setReciboSubTab(v as ReciboSubTab)} className="space-y-6">
              <div className="flex justify-center print:hidden">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="grain" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Grãos
                  </TabsTrigger>
                  <TabsTrigger value="tramp" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    TRAMP
                  </TabsTrigger>
                  <TabsTrigger value="g2" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    G2
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="grain">
                <GrainReciboManager />
              </TabsContent>
              <TabsContent value="tramp">
                <TrampReciboManager variant="tramp" />
              </TabsContent>
              <TabsContent value="g2">
                <TrampReciboManager variant="g2" />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="bl" className="space-y-8">
            <section className="text-center animate-fade-in print:hidden">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bill of Lading - CONGENBILL
              </h2>
            </section>
            <section>
              <BLManager />
            </section>
          </TabsContent>

          <TabsContent value="interleave" className="space-y-8">
            <section>
              <BLInterleaveManager />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
