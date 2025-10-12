import type { AcademicArea, PaperType } from '@/types/paper';

export const formatPaperType = (type: PaperType | string): string => {
  // Normalizar para lowercase para compatibilidade com backend
  const normalizedType = type?.toLowerCase() as PaperType;

  const typeMap: Record<PaperType, string> = {
    article: 'Artigo',
    summary: 'Resumo',
    review: 'Resenha',
    thesis: 'TCC',
    dissertation: 'Dissertação',
    monography: 'Monografia',
    case_study: 'Estudo de Caso',
    project: 'Projeto',
    essay: 'Ensaio',
  };
  return typeMap[normalizedType] || type;
};

export const formatAcademicArea = (area: AcademicArea): string => {
  const areaMap: Record<AcademicArea, string> = {
    administration: 'Administração',
    law: 'Direito',
    education: 'Educação',
    engineering: 'Engenharias',
    psychology: 'Psicologia',
    health: 'Saúde',
    accounting: 'Contabilidade',
    arts: 'Artes',
    economics: 'Economia',
    social_sciences: 'Ciências Sociais',
    other: 'Outras',
    exact_sciences: 'Ciências Exatas',
    biological_sciences: 'Ciências Biológicas',
    health_sciences: 'Ciências da Saúde',
    applied_social_sciences: 'Ciências Sociais Aplicadas',
    humanities: 'Ciências Humanas',
    languages: 'Linguística/Letras/Artes',
    agricultural_sciences: 'Ciências Agrárias',
    multidisciplinary: 'Multidisciplinar',
  };
  return areaMap[area] || area;
};

export const formatLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    pt: 'Português',
    en: 'Inglês',
    es: 'Espanhol',
    fr: 'Francês',
  };
  return languageMap[language] || language;
};

export const formatPrice = (priceInCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100);
};

export const formatKeywords = (keywords: string | null): string[] => {
  if (!keywords) return [];
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
};
