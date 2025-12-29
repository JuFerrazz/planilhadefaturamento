import { FileSpreadsheet } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Planilha de Faturamento APS</h1>
            <p className="text-xs text-muted-foreground">Conversor de planilha APS</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-8 animate-fade-in">
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
      </main>
    </div>
  );
};

export default Index;
