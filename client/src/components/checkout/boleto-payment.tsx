import { Button } from '@/components/ui/button';
import { Receipt, ExternalLink, Printer } from 'lucide-react';

interface BoletoPaymentProps {
  data: {
    url: string;
    barcode: string;
  };
}

export default function BoletoPayment({ data }: BoletoPaymentProps) {
  const handlePrint = () => {
    window.open(data.url, '_blank');
  };

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex items-center justify-center gap-2 text-primary">
        <Receipt className="h-6 w-6" />
        <h3 className="text-xl font-bold">Boleto Bancário</h3>
      </div>

      <div className="bg-muted/50 p-8 rounded-lg">
        <Receipt className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Seu boleto foi gerado com sucesso!
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={handlePrint} size="lg" className="w-full">
          <Printer className="h-4 w-4 mr-2" />
          Visualizar e Imprimir Boleto
        </Button>

        <Button onClick={handlePrint} variant="outline" size="lg" className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Boleto em Nova Aba
        </Button>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-left">
        <p className="text-xs font-semibold mb-2">Instruções:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>O boleto vence em 7 dias corridos</li>
          <li>Após o pagamento, aguarde até 2 dias úteis para compensação</li>
          <li>Você receberá um email assim que o pagamento for confirmado</li>
          <li>Seu acesso ao curso será liberado automaticamente após a confirmação</li>
        </ul>
      </div>

      {data.barcode && (
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Código de Barras:</p>
          <p className="font-mono bg-muted p-2 rounded">{data.barcode}</p>
        </div>
      )}
    </div>
  );
}
