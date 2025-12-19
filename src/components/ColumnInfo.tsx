import { ArrowRight, Table2 } from 'lucide-react';

const inputColumns = [
  'Name of shipper',
  'Qtd per BL',
  'BL nbr',
  'Qtd per DU-E',
  'CNPJ/VAT',
  'DU-E',
  'Customs broker'
];

const outputColumns = [
  { name: 'BL nbr', desc: 'Copiado da entrada' },
  { name: 'Name of shipper', desc: 'Copiado da entrada' },
  { name: 'CNPJ/VAT', desc: 'Copiado da entrada' },
  { name: 'Qtd BLs', desc: 'Contagem por shipper' },
  { name: 'Valor unitário', desc: 'R$ 300,00 fixo' },
  { name: 'Valor total', desc: 'Qtd × Valor unitário' },
  { name: 'Customs Broker', desc: 'Copiado da entrada' },
  { name: 'Contato', desc: 'Campo vazio' }
];

export function ColumnInfo() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Input */}
      <div className="bg-card rounded-xl border p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Table2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Planilha de Entrada</h3>
        </div>
        <ul className="space-y-2">
          {inputColumns.map((col, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span className="text-foreground">{col}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Output */}
      <div className="bg-card rounded-xl border p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Planilha Base (Saída)</h3>
        </div>
        <ul className="space-y-2">
          {outputColumns.map((col, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span className="text-foreground">{col.name}</span>
              <span className="text-muted-foreground text-xs ml-auto">{col.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
