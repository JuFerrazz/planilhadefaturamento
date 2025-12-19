import { FileSpreadsheet } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { ColumnInfo } from '@/components/ColumnInfo';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Planilha de Faturamento APS</h1>
            <p className="text-xs text-muted-foreground">Conversor de planilhas</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transforme sua planilha em segundos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Carregue sua planilha Excel e gere automaticamente a planilha base padronizada 
            com todos os cálculos prontos.
          </p>
        </section>

        {/* Upload Section */}
        <section className="mb-16">
          <FileUploader />
        </section>

        {/* Column Info Section */}
        <section>
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Estrutura das Planilhas
          </h3>
          <ColumnInfo />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          Desenvolvido para automatizar processos de exportação
        </div>
      </footer>
    </div>
  );
};

export default Index;
