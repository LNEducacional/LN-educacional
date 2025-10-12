import type { AcademicArea } from '@/types/ebook';

export const formatEbookAcademicArea = (area: AcademicArea): string => {
  const areaMap: Record<AcademicArea, string> = {
    ADMINISTRATION: 'Administração',
    LAW: 'Direito',
    EDUCATION: 'Educação',
    ENGINEERING: 'Engenharia',
    PSYCHOLOGY: 'Psicologia',
    HEALTH: 'Saúde',
    ACCOUNTING: 'Contabilidade',
    ARTS: 'Artes',
    ECONOMICS: 'Economia',
    SOCIAL_SCIENCES: 'Ciências Sociais',
    EXACT_SCIENCES: 'Ciências Exatas',
    BIOLOGICAL_SCIENCES: 'Ciências Biológicas',
    HEALTH_SCIENCES: 'Ciências da Saúde',
    APPLIED_SOCIAL_SCIENCES: 'Ciências Sociais Aplicadas',
    HUMANITIES: 'Ciências Humanas',
    LANGUAGES: 'Linguística, Letras e Artes',
    AGRICULTURAL_SCIENCES: 'Ciências Agrárias',
    MULTIDISCIPLINARY: 'Multidisciplinar',
    OTHER: 'Outros',
  };
  return areaMap[area] || area;
};

export const formatEbookPrice = (priceInCents: number): string => {
  if (priceInCents === 0) {
    return 'Gratuito';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100);
};

export const formatEbookFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};
