import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Maria Silva',
    role: 'Estudante de Administração',
    avatar: '/avatars/maria.jpg',
    content:
      'A LN Educacional me ajudou muito durante minha graduação. Os trabalhos prontos são de excelente qualidade e me serviram como base para meus estudos.',
    rating: 5,
    course: 'TCC em Administração',
  },
  {
    id: 2,
    name: 'João Santos',
    role: 'Desenvolvedor Web',
    avatar: '/avatars/joao.jpg',
    content:
      'Os cursos de programação são fantásticos! Consegui mudar de carreira e hoje trabalho como desenvolvedor em uma empresa de tecnologia.',
    rating: 5,
    course: 'Desenvolvimento Web Completo',
  },
  {
    id: 3,
    name: 'Ana Costa',
    role: 'Designer Gráfico',
    avatar: '/avatars/ana.jpg',
    content:
      'O curso de UI/UX Design me deu todas as ferramentas necessárias para atuar na área. Recomendo muito!',
    rating: 5,
    course: 'UI/UX Design Profissional',
  },
  {
    id: 4,
    name: 'Carlos Oliveira',
    role: 'Empresário',
    avatar: '/avatars/carlos.jpg',
    content:
      'Excelente plataforma para capacitação profissional. Os materiais são atualizados e de alta qualidade.',
    rating: 5,
    course: 'Marketing Digital Estratégico',
  },
  {
    id: 5,
    name: 'Fernanda Lima',
    role: 'Estudante de Enfermagem',
    avatar: '/avatars/fernanda.jpg',
    content:
      'Encontrei materiais excelentes para meus estudos. A qualidade do conteúdo é impressionante.',
    rating: 5,
    course: 'TCC em Enfermagem',
  },
];

export default function TestimonialsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlay(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlay(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold">
            O que nossos <span className="text-gradient-primary">alunos</span> dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de estudantes já transformaram suas carreiras com nossos cursos e materiais
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial card */}
          <Card className="bg-background border-2 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                {/* Avatar and Info */}
                <div className="flex flex-col items-center lg:items-start space-y-4 lg:min-w-[200px]">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={testimonials[currentIndex].avatar} />
                    <AvatarFallback className="text-lg">
                      {testimonials[currentIndex].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center lg:text-left">
                    <h3 className="font-semibold text-lg">{testimonials[currentIndex].name}</h3>
                    <p className="text-muted-foreground">{testimonials[currentIndex].role}</p>
                    <p className="text-sm text-primary font-medium mt-1">
                      {testimonials[currentIndex].course}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <Quote className="h-8 w-8 text-primary opacity-20" />
                  <blockquote className="text-lg leading-relaxed">
                    "{testimonials[currentIndex].content}"
                  </blockquote>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-12 w-12 rounded-full shadow-lg bg-background"
            onClick={prevTestimonial}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-12 w-12 rounded-full shadow-lg bg-background"
            onClick={nextTestimonial}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => goToTestimonial(index)}
              />
            ))}
          </div>
        </div>

        {/* Mini testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <Card key={testimonial.id} className="bg-background/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">"{testimonial.content.slice(0, 120)}..."</p>
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
