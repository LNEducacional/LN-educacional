import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ServicesSection() {
  const services = [
    {
      id: 1,
      title: 'Trabalhos Prontos',
      description:
        'Acesse nossa biblioteca com milhares de trabalhos acadêmicos prontos para download imediato.',
      image:
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      buttonText: 'Explorar agora',
      href: '/ready-papers',
    },
    {
      id: 2,
      title: 'Trabalhos Personalizados',
      description:
        'Solicite trabalhos acadêmicos sob medida, elaborados por especialistas nas mais diversas áreas.',
      image:
        'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      buttonText: 'Solicitar agora',
      href: '/custom-papers',
    },
    {
      id: 3,
      title: 'Cursos Online',
      description:
        'Aprenda no seu ritmo com cursos completos, materiais exclusivos e certificado de conclusão.',
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      buttonText: 'Ver catálogo',
      href: '/courses',
    },
    {
      id: 4,
      title: 'E-books & Apostilas',
      description:
        'Materiais didáticos completos para download, organizados por área de conhecimento.',
      image:
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      buttonText: 'Acessar biblioteca',
      href: '/ebooks',
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Nossos <span className="text-gradient-primary">Serviços</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Conheça todas as soluções que oferecemos para impulsionar sua vida acadêmica.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-strong transition-all duration-300 card-hover animate-slide-up hover-scale flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Service Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Service Content */}
              <div className="p-6 space-y-4 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-foreground">{service.title}</h3>

                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {service.description}
                </p>

                <Button
                  variant="ghost"
                  className="w-full justify-between text-primary hover:text-primary hover:bg-primary/5 group p-0 h-auto"
                  asChild
                >
                  <Link to={service.href}>
                    {service.buttonText}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
