import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DatePickerInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  error?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  disabled,
  placeholder = 'DD/MM/AAAA',
  className,
  error = false,
}: DatePickerInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Sincroniza o inputValue quando o value externo muda
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else if (!value) {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Remove tudo exceto números
    const numbersOnly = newValue.replace(/\D/g, '');

    // Aplica a máscara DD/MM/AAAA
    let formatted = numbersOnly;
    if (numbersOnly.length >= 2) {
      formatted = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2);
    }
    if (numbersOnly.length >= 4) {
      formatted = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2, 4) + '/' + numbersOnly.slice(4);
    }
    if (numbersOnly.length > 8) {
      formatted = formatted.slice(0, 10);
    }

    setInputValue(formatted);

    // Tenta fazer o parsing apenas se o formato estiver completo
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        // Verifica se a data não está desabilitada
        if (!disabled || !disabled(parsedDate)) {
          onChange(parsedDate);
        }
      } else {
        // Data inválida, limpa o valor do formulário
        onChange(undefined);
      }
    } else if (formatted.length === 0) {
      // Se o campo foi limpo, limpa também o valor do formulário
      onChange(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(format(date, 'dd/MM/yyyy'));
      setIsOpen(false); // Fecha o popover após selecionar
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, tab e setas
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Determina se deve mostrar borda de erro
  const showError = error || (inputValue.length === 10 && !value);

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        className={cn('flex-1', showError && 'border-destructive focus-visible:ring-destructive')}
        maxLength={10}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('shrink-0', !value && 'text-muted-foreground')}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">Abrir calendário</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={disabled}
            initialFocus
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
