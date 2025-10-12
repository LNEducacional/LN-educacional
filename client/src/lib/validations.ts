import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// Profile validations
export const profileSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Senha atual é obrigatória para alterar a senha',
      path: ['currentPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }
  );

// Checkout validations
export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(3, 'Nome completo é obrigatório'),
    email: z.string().email('Email inválido'),
    cpfCnpj: z
      .string()
      .min(11, 'CPF/CNPJ inválido')
      .max(14, 'CPF/CNPJ inválido')
      .regex(/^[0-9]+$/, 'CPF/CNPJ deve conter apenas números'),
    phone: z
      .string()
      .min(10, 'Telefone inválido')
      .max(11, 'Telefone inválido')
      .regex(/^[0-9]+$/, 'Telefone deve conter apenas números'),
  }),
  paymentMethod: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' }),
  }),
});

// Product validations
export const paperSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  pages: z.number().min(1, 'Número de páginas deve ser maior que 0'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  academicArea: z.enum([
    'ADMINISTRACAO',
    'DIREITO',
    'EDUCACAO',
    'ENGENHARIA',
    'LETRAS',
    'EXATAS',
    'SAUDE',
    'TECNOLOGIA',
    'CIENCIAS_HUMANAS',
    'CIENCIAS_SOCIAIS',
  ]),
  isFree: z.boolean(),
  fileUrl: z.string().url('URL do arquivo inválida').optional(),
  thumbnailUrl: z.string().url('URL da imagem inválida').optional(),
});

export const courseSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  instructor: z.string().min(3, 'Nome do instrutor é obrigatório'),
  duration: z.number().min(1, 'Duração deve ser maior que 0'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  academicArea: z.enum([
    'ADMINISTRACAO',
    'DIREITO',
    'EDUCACAO',
    'ENGENHARIA',
    'LETRAS',
    'EXATAS',
    'SAUDE',
    'TECNOLOGIA',
    'CIENCIAS_HUMANAS',
    'CIENCIAS_SOCIAIS',
  ]),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  thumbnailUrl: z.string().url('URL da imagem inválida').optional(),
  videoUrl: z.string().url('URL do vídeo inválida').optional(),
});

export const ebookSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  author: z.string().min(3, 'Nome do autor é obrigatório'),
  pages: z.number().min(1, 'Número de páginas deve ser maior que 0'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  academicArea: z.enum([
    'ADMINISTRACAO',
    'DIREITO',
    'EDUCACAO',
    'ENGENHARIA',
    'LETRAS',
    'EXATAS',
    'SAUDE',
    'TECNOLOGIA',
    'CIENCIAS_HUMANAS',
    'CIENCIAS_SOCIAIS',
  ]),
  fileUrl: z.string().url('URL do arquivo inválida').optional(),
  coverImageUrl: z.string().url('URL da capa inválida').optional(),
});

// Free Paper validations
export const freePaperSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  authorName: z.string().min(3, 'Nome do autor é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  paperType: z.enum(
    [
      'article',
      'summary',
      'review',
      'thesis',
      'dissertation',
      'monography',
      'case_study',
      'project',
      'essay',
    ],
    {
      errorMap: () => ({ message: 'Tipo de trabalho inválido' }),
    }
  ),
  academicArea: z.enum(
    [
      'exact_sciences',
      'biological_sciences',
      'health_sciences',
      'applied_social_sciences',
      'humanities',
      'engineering',
      'languages',
      'agricultural_sciences',
      'multidisciplinary',
      'social_sciences',
      'other',
    ],
    {
      errorMap: () => ({ message: 'Área acadêmica inválida' }),
    }
  ),
  pageCount: z.number().min(1, 'Número de páginas deve ser maior que 0'),
  language: z.enum(['pt', 'en', 'es', 'fr'], {
    errorMap: () => ({ message: 'Idioma inválido' }),
  }),
  keywords: z.array(z.string()).optional(),
});

// Blog validations
export const blogPostSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  content: z.string().min(50, 'Conteúdo deve ter no mínimo 50 caracteres'),
  excerpt: z
    .string()
    .min(10, 'Resumo deve ter no mínimo 10 caracteres')
    .max(200, 'Resumo deve ter no máximo 200 caracteres'),
  coverImageUrl: z.string().url('URL da imagem inválida').optional(),
  published: z.boolean(),
});

// Contact validations
export const contactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
});

// Collaborator application validations
export const collaboratorSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .max(11, 'Telefone inválido')
    .regex(/^[0-9]+$/, 'Telefone deve conter apenas números'),
  area: z.string().min(3, 'Área de atuação é obrigatória'),
  experience: z.string().min(10, 'Descreva sua experiência'),
  availability: z.enum(['FULL_TIME', 'PART_TIME', 'FREELANCE'], {
    errorMap: () => ({ message: 'Selecione sua disponibilidade' }),
  }),
  resumeUrl: z.string().url('URL do currículo inválida').optional(),
});

// Utility functions
export const formatCPFCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 11) {
    // CPF
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  // CNPJ
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 10) {
    // Fixo
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  // Celular
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

export const priceToCents = (price: string | number) => {
  if (typeof price === 'number') return Math.round(price * 100);
  const cleanPrice = price.replace(/[^\d,]/g, '').replace(',', '.');
  return Math.round(Number.parseFloat(cleanPrice) * 100);
};

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaperInput = z.infer<typeof paperSchema>;
export type FreePaperInput = z.infer<typeof freePaperSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type EbookInput = z.infer<typeof ebookSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CollaboratorInput = z.infer<typeof collaboratorSchema>;
