import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { academicAreaLabels, paperTypeLabels } from '@/data/mock-papers';
import type { PaperFilters } from '@/types/paper';
import { RotateCcw } from 'lucide-react';

interface PaperFiltersProps {
  filters: PaperFilters;
  onFiltersChange: (filters: PaperFilters) => void;
  onReset: () => void;
}

export function PaperFiltersComponent({ filters, onFiltersChange, onReset }: PaperFiltersProps) {
  const handleAcademicAreaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      academicArea: value as PaperFilters['academicArea'],
    });
  };

  const handlePaperTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paperType: value as PaperFilters['paperType'],
    });
  };

  const handleMaxPagesChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      maxPages: value[0],
    });
  };

  const handleMaxPriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      maxPrice: value[0],
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Filtros</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Área Acadêmica */}
        <div className="space-y-2">
          <Label htmlFor="academic-area" className="text-sm font-medium text-foreground">
            Área Acadêmica
          </Label>
          <Select value={filters.academicArea} onValueChange={handleAcademicAreaChange}>
            <SelectTrigger id="academic-area">
              <SelectValue placeholder="Selecione uma área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {Object.entries(academicAreaLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Trabalho */}
        <div className="space-y-2">
          <Label htmlFor="paper-type" className="text-sm font-medium text-foreground">
            Tipo de Trabalho
          </Label>
          <Select value={filters.paperType} onValueChange={handlePaperTypeChange}>
            <SelectTrigger id="paper-type">
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(paperTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Máximo de Páginas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Máximo de Páginas: {filters.maxPages}
          </Label>
          <Slider
            value={[filters.maxPages]}
            onValueChange={handleMaxPagesChange}
            max={200}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>200</span>
          </div>
        </div>

        {/* Preço Máximo */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Preço Máximo:{' '}
            {(filters.maxPrice / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </Label>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={handleMaxPriceChange}
            max={10000}
            min={0}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 0</span>
            <span>R$ 100</span>
          </div>
        </div>

        {/* Botão Reset */}
        <Button variant="outline" onClick={onReset} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Filtros
        </Button>
      </CardContent>
    </Card>
  );
}
