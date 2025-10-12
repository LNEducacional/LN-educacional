import { Star } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      rating: 5,
      comment:
        'Os cursos da LN Educacional me ajudaram a entender melhor metodologia científica. O material é excelente e o suporte é ainda melhor.',
      author: 'Mariana Pereira',
      role: 'Estudante de Psicologia',
      initials: 'MP',
      image: '/MP.jpg',
    },
    {
      id: 2,
      rating: 4.5,
      comment:
        'Comprei um trabalho pronto que me serviu como excelente base de estudos. A qualidade do conteúdo superou minhas expectativas.',
      author: 'Rafael Santos',
      role: 'Estudante de Administração',
      initials: 'RS',
      image: '/RS.jpg',
    },
    {
      id: 3,
      rating: 5,
      comment:
        'Solicitei um trabalho personalizado e o resultado ficou incrível. Entrega antes do prazo e com um conteúdo muito bem fundamentado.',
      author: 'Carla Almeida',
      role: 'Estudante de Direito',
      initials: 'CA',
      image: '/CA.jpg',
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-5xl font-bold">
            O que nossos <span className="text-gradient-primary">clientes dizem</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Veja a opinião de quem já utilizou nossos serviços e transformou sua jornada acadêmica.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm hover:shadow-strong transition-all duration-300 card-hover animate-slide-up hover-scale"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Stars */}
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={`star-${testimonial.id}-${i}`}
                    className={`h-4 w-4 ${
                      i < Math.floor(testimonial.rating)
                        ? 'fill-green-500 text-green-500'
                        : i === Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0
                          ? 'fill-green-500/50 text-green-500'
                          : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-foreground leading-relaxed">"{testimonial.comment}"</p>

              {/* Author */}
              <div className="flex items-center space-x-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            type="button"
            className="px-6 py-3 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            Ver mais depoimentos
          </button>
        </div>
      </div>
    </section>
  );
}
