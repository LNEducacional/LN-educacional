import { Award, BookOpen, Clock, HeadphonesIcon, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const benefits = [
  {
    icon: Clock,
    title: 'Aprenda no seu ritmo',
    description:
      'Estude quando e onde quiser, com acesso vitalício aos conteúdos e flexibilidade total.',
  },
  {
    icon: Award,
    title: 'Certificado reconhecido',
    description: 'Receba certificados digitais válidos que comprovam suas competências no mercado.',
  },
  {
    icon: Users,
    title: 'Comunidade ativa',
    description: 'Conecte-se com outros alunos e instrutores em nossa comunidade exclusiva.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Suporte especializado',
    description: 'Conte com apoio direto dos instrutores e nossa equipe de suporte técnico.',
  },
  {
    icon: BookOpen,
    title: 'Conteúdo atualizado',
    description: 'Materiais sempre atualizados com as últimas tendências e tecnologias do mercado.',
  },
  {
    icon: TrendingUp,
    title: 'Progresso mensurável',
    description: 'Acompanhe seu desenvolvimento com relatórios detalhados e metas personalizadas.',
  },
];

export function BenefitsSection() {
  const navigate = useNavigate();

  const handleExplorarServicos = () => {
    navigate('/courses');
  };

  const handleFalarConsultor = () => {
    const phoneNumber = '5594984211357'; // Formato internacional: +55 94 98421-1357
    const message = encodeURIComponent(
      'Olá! Gostaria de falar com um especialista da LN Educacional sobre os serviços oferecidos.'
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Por que escolher a <span className="text-gradient-accent">LN Educacional</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Oferecemos uma experiência de aprendizado completa, com recursos pensados para maximizar
            seu desenvolvimento profissional.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="group bg-card border border-border rounded-xl p-8 hover:shadow-medium hover:border-muted-foreground/20 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-primary group-hover:text-accent transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center animate-fade-in">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 md:p-12 text-white">
            <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
              <h3 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white">
                Pronto para transformar sua vida acadêmica?
              </h3>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed">
                Junte-se a milhares de estudantes que já estão aproveitando nossos recursos
                educacionais para alcançar seus objetivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
                <button
                  type="button"
                  onClick={handleExplorarServicos}
                  className="bg-white text-primary hover:bg-gray-50 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-300 hover:shadow-lg text-sm sm:text-base"
                >
                  Explorar serviços
                </button>
                <button
                  type="button"
                  onClick={handleFalarConsultor}
                  className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base"
                >
                  Falar com um consultor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
