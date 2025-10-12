import type { AcademicArea, CourseStatus } from '@/types/course';

export function formatAcademicArea(area: AcademicArea | string): string {
  // Normalizar para uppercase para comparação
  const normalizedArea = area.toUpperCase();

  const areaMap: Record<string, string> = {
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
    HUMANITIES: 'Humanidades',
    LANGUAGES: 'Idiomas',
    AGRICULTURAL_SCIENCES: 'Ciências Agrárias',
    MULTIDISCIPLINARY: 'Multidisciplinar',
    OTHER: 'Outros',
  };

  return areaMap[normalizedArea] || area;
}

export function formatCourseStatus(status: CourseStatus): string {
  return status === 'ACTIVE' ? 'Ativo' : 'Inativo';
}

export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) {
    return 'Gratuito';
  }

  const priceInReais = priceInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInReais);
}

export function formatDuration(durationInMinutes: number): string {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function centsToBRL(cents: number): number {
  return cents / 100;
}

export function BRLToCents(reais: number): number {
  return Math.round(reais * 100);
}
