import { WhatsAppFloatingButton } from '@/components/whatsapp-floating-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star, Users, Award, ThumbsUp, GraduationCap } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Dados mockados de depoimentos
const testimonials = [
  {
    id: 1,
    rating: 5,
    comment:
      'Os cursos da LN Educacional me ajudaram a entender melhor metodologia científica. O material é excelente e o suporte é ainda melhor. Recomendo para todos que buscam aprimorar seus conhecimentos acadêmicos.',
    author: 'Mariana Pereira',
    role: 'Estudante de Psicologia',
    institution: 'USP',
    date: '2024-11-15',
    service: 'Cursos Online',
    verified: true,
  },
  {
    id: 2,
    rating: 5,
    comment:
      'Comprei um trabalho pronto que me serviu como excelente base de estudos. A qualidade do conteúdo superou minhas expectativas. As referências bibliográficas eram atualizadas e pertinentes.',
    author: 'Rafael Santos',
    role: 'Estudante de Administração',
    institution: 'FGV',
    date: '2024-11-10',
    service: 'Trabalhos Prontos',
    verified: true,
  },
  {
    id: 3,
    rating: 5,
    comment:
      'Solicitei um trabalho personalizado e o resultado ficou incrível. Entrega antes do prazo e com um conteúdo muito bem fundamentado. A equipe foi muito atenciosa durante todo o processo.',
    author: 'Carla Almeida',
    role: 'Estudante de Direito',
    institution: 'PUC-SP',
    date: '2024-11-08',
    service: 'Trabalhos Personalizados',
    verified: true,
  },
  {
    id: 4,
    rating: 5,
    comment:
      'Excelente plataforma! Encontrei materiais de apoio que me ajudaram muito na preparação do meu TCC. A navegação é intuitiva e o conteúdo é de altíssima qualidade.',
    author: 'Lucas Ferreira',
    role: 'Estudante de Engenharia Civil',
    institution: 'UNICAMP',
    date: '2024-11-05',
    service: 'Trabalhos Gratuitos',
    verified: true,
  },
  {
    id: 5,
    rating: 4,
    comment:
      'Os e-books disponíveis são muito completos e bem estruturados. Me ajudaram a entender conceitos complexos de forma simples e didática. Vale muito o investimento!',
    author: 'Juliana Costa',
    role: 'Estudante de Pedagogia',
    institution: 'UFMG',
    date: '2024-10-28',
    service: 'E-books',
    verified: true,
  },
  {
    id: 6,
    rating: 5,
    comment:
      'Atendimento excepcional! Tive uma dúvida sobre um curso e fui atendido rapidamente pelo WhatsApp. A equipe é muito profissional e prestativa.',
    author: 'Pedro Oliveira',
    role: 'Estudante de Contabilidade',
    institution: 'UFRJ',
    date: '2024-10-25',
    service: 'Cursos Online',
    verified: true,
  },
  {
    id: 7,
    rating: 5,
    comment:
      'Já utilizei os serviços várias vezes e sempre fiquei satisfeito. A qualidade é consistente e os preços são justos. Indico para todos os meus colegas de faculdade.',
    author: 'Amanda Silva',
    role: 'Estudante de Marketing',
    institution: 'ESPM',
    date: '2024-10-20',
    service: 'Trabalhos Prontos',
    verified: true,
  },
  {
    id: 8,
    rating: 5,
    comment:
      'O trabalho personalizado que solicitei foi fundamental para minha aprovação. O conteúdo era original, bem pesquisado e seguiu todas as normas ABNT corretamente.',
    author: 'Bruno Martins',
    role: 'Estudante de Economia',
    institution: 'INSPER',
    date: '2024-10-15',
    service: 'Trabalhos Personalizados',
    verified: true,
  },
  {
    id: 9,
    rating: 4,
    comment:
      'Ótima experiência! Os cursos online são bem estruturados e o certificado foi aceito sem problemas pelo meu empregador. Pretendo fazer mais cursos em breve.',
    author: 'Fernanda Lima',
    role: 'Profissional de RH',
    institution: 'Empresa Privada',
    date: '2024-10-10',
    service: 'Cursos Online',
    verified: true,
  },
  {
    id: 10,
    rating: 5,
    comment:
      'Material de primeira qualidade! Usei como referência para minha dissertação de mestrado. As fontes eram confiáveis e o conteúdo muito bem elaborado.',
    author: 'Carlos Eduardo',
    role: 'Mestrando em História',
    institution: 'USP',
    date: '2024-10-05',
    service: 'Trabalhos Prontos',
    verified: true,
  },
  {
    id: 11,
    rating: 5,
    comment:
      'Surpreendente a rapidez na entrega do trabalho personalizado. Mesmo com prazo apertado, recebi um material impecável. Muito obrigada!',
    author: 'Beatriz Mendes',
    role: 'Estudante de Enfermagem',
    institution: 'UNIFESP',
    date: '2024-09-28',
    service: 'Trabalhos Personalizados',
    verified: true,
  },
  {
    id: 12,
    rating: 5,
    comment:
      'A LN Educacional salvou meu semestre! O suporte por WhatsApp é muito ágil e a qualidade dos materiais é incomparável. Recomendo de olhos fechados.',
    author: 'Gabriel Souza',
    role: 'Estudante de Medicina',
    institution: 'UFPR',
    date: '2024-09-20',
    service: 'Trabalhos Prontos',
    verified: true,
  },
];

// Estatísticas mockadas
const stats = [
  { icon: Users, value: '15.000+', label: 'Clientes Satisfeitos' },
  { icon: Award, value: '98%', label: 'Taxa de Aprovação' },
  { icon: ThumbsUp, value: '4.9/5', label: 'Avaliação Média' },
  { icon: GraduationCap, value: '50.000+', label: 'Trabalhos Entregues' },
];

// Componente de estrelas
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i === Math.floor(rating) && rating % 1 !== 0
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

// Componente de card de depoimento
const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) => (
  <Card
    className="h-full bg-card border-border hover:shadow-lg transition-all duration-300 animate-slide-up"
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    <CardContent className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <StarRating rating={testimonial.rating} />
        {testimonial.verified && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Verificado
          </Badge>
        )}
      </div>

      {/* Quote */}
      <div className="flex-1 mb-4">
        <Quote className="h-8 w-8 text-primary/20 mb-2" />
        <p className="text-foreground leading-relaxed">{testimonial.comment}</p>
      </div>

      {/* Service Badge */}
      <Badge variant="outline" className="w-fit mb-4">
        {testimonial.service}
      </Badge>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
          {testimonial.author.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">{testimonial.author}</div>
          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
          <div className="text-xs text-muted-foreground">{testimonial.institution}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function TestimonialsPage() {
  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-1">
              <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
              +15.000 Clientes Satisfeitos
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              O que nossos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                clientes dizem
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Histórias reais de estudantes e profissionais que transformaram sua jornada acadêmica
              com a ajuda da LN Educacional.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-3">
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para fazer parte dessa história?
            </h2>
            <p className="text-lg text-muted-foreground">
              Junte-se a milhares de estudantes que já transformaram sua jornada acadêmica
              com nossos serviços de qualidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/ready-papers"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Ver Trabalhos Prontos
              </Link>
              <Link
                to="/custom-papers"
                className="inline-flex items-center justify-center px-8 py-3 border border-border bg-background text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Solicitar Trabalho Personalizado
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Button */}
      <WhatsAppFloatingButton />
    </div>
  );
}
