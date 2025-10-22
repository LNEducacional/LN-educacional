import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/utils/course-formatters';

interface CreditCardFormProps {
  data: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  onChange: (data: any) => void;
  installments: number;
  onInstallmentsChange: (installments: number) => void;
  totalAmount: number;
}

export default function CreditCardForm({
  data,
  onChange,
  installments,
  onInstallmentsChange,
  totalAmount,
}: CreditCardFormProps) {
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    onChange({ ...data, number: formatted });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);

  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <Input
          id="cardNumber"
          value={data.number}
          onChange={handleCardNumberChange}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
        />
      </div>

      <div>
        <Label htmlFor="holderName">Nome no Cartão</Label>
        <Input
          id="holderName"
          value={data.holderName}
          onChange={(e) => onChange({ ...data, holderName: e.target.value.toUpperCase() })}
          placeholder="JOÃO DA SILVA"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expiryMonth">Mês</Label>
          <Select value={data.expiryMonth} onValueChange={(v) => onChange({ ...data, expiryMonth: v })}>
            <SelectTrigger>
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="expiryYear">Ano</Label>
          <Select value={data.expiryYear} onValueChange={(v) => onChange({ ...data, expiryYear: v })}>
            <SelectTrigger>
              <SelectValue placeholder="AAAA" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ccv">CVV</Label>
          <Input
            id="ccv"
            value={data.ccv}
            onChange={(e) => onChange({ ...data, ccv: e.target.value.replace(/\D/g, '') })}
            placeholder="123"
            maxLength={4}
            type="password"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="installments">Parcelamento</Label>
        <Select value={installments.toString()} onValueChange={(v) => onInstallmentsChange(Number.parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {installmentOptions.map((count) => {
              const installmentValue = totalAmount / count;
              return (
                <SelectItem key={count} value={count.toString()}>
                  {count}x de {formatPrice(installmentValue)}
                  {count === 1 && ' (à vista)'}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
