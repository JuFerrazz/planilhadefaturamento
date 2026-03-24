import { useState } from 'react';
import { FileSpreadsheet, FileText, Package, Printer } from 'lucide-react';
import { SugarManager } from '@/components/SugarManager';
import { GrainReciboManager } from '@/components/GrainReciboManager';
import { BLManager } from '@/components/BLManager';
import { BLInterleaveManager } from '@/components/BLInterleaveManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'sugar' | 'grain' | 'bl' | 'interleave'>('sugar');
  const [activeLeftTab, setActiveLeftTab] = useState<'sugar' | 'grain' | 'interleave'>('sugar');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Rochamar - Ferramentas</h1>
            <p className="text-xs text-muted-foreground">Faturamento, recibos e BLs</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-10 print:py-0 print:px-0 print:max-w-none print:w-full">
        <div className="flex gap-6 print:block">

          {/* Left panel — Açúcar, Grãos, Emissão */}
          <div className="flex-1 min-w-0 print:hidden">
            <Tabs value={activeLeftTab} onValueChange={(v) => setActiveLeftTab(v as typeof activeLeftTab)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sugar" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Açúcar
                </TabsTrigger>
                <TabsTrigger value="grain" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Grãos
                </TabsTrigger>
                <TabsTrigger value="interleave" className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Emissão
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sugar">
                <SugarManager />
              </TabsContent>

              <TabsContent value="grain">
                <GrainReciboManager />
              </TabsContent>

              <TabsContent value="interleave">
                <BLInterleaveManager />
              </TabsContent>
            </Tabs>
          </div>

          {/* Divider */}
          <div className="w-px bg-border/60 self-stretch print:hidden" />

          {/* Right panel — BL */}
          <div className="w-[55%] shrink-0 print:w-full">
            <div className="flex items-center gap-2 mb-4 print:hidden">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">BL Alfândega</span>
            </div>
            <BLManager />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Index;
