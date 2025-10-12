import designImage from '@/assets/course-design.jpg';
import marketingImage from '@/assets/course-marketing.jpg';
import programmingImage from '@/assets/course-programming.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Star, Users } from 'lucide-react';
import { memo, useMemo } from 'react';

const courses = [
  {
    id: 1,
    title: 'Desenvolvimento Web Completo',
    description:
      'Aprenda React, Node.js e TypeScript do zero ao avançado. Construa aplicações profissionais e escaláveis.',
    instructor: 'Prof. Carlos Silva',
    image: programmingImage,
    rating: 4.9,
    students: 2847,
    duration: '40 horas',
    level: 'Intermediário',
    price: 'R$ 299',
    category: 'Programação',
  },
  {
    id: 2,
    title: 'Marketing Digital Estratégico',
    description:
      'Domine as principais estratégias de marketing digital, SEO, redes sociais e campanhas pagas.',
    instructor: 'Profa. Ana Costa',
    image: marketingImage,
    rating: 4.8,
    students: 1965,
    duration: '32 horas',
    level: 'Iniciante',
    price: 'R$ 249',
    category: 'Marketing',
  },
  {
    id: 3,
    title: 'UI/UX Design Profissional',
    description:
      'Crie interfaces incríveis e experiências de usuário memoráveis usando Figma e princípios de design.',
    instructor: 'Prof. Miguel Santos',
    image: designImage,
    rating: 4.9,
    students: 1534,
    duration: '28 horas',
    level: 'Intermediário',
    price: 'R$ 279',
    category: 'Design',
  },
];

const CoursesSection = memo(function CoursesSection() {
  return (
    <section id="cursos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Cursos em <span className="text-gradient-primary">destaque</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa seleção de cursos mais populares, criados por especialistas para acelerar
            sua carreira.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="card-hover group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Course Image */}
              <div className="relative overflow-hidden rounded-lg mb-6">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    {course.category}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-accent text-accent-foreground">{course.level}</Badge>
                </div>
              </div>

              {/* Course Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span>Por </span>
                  <span className="font-medium text-foreground">{course.instructor}</span>
                </div>

                {/* Course Stats */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-accent fill-accent" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-border">
                  <div className="text-xl sm:text-2xl font-bold text-primary">{course.price}</div>
                  <Button className="btn-accent group w-full sm:w-auto">
                    Ver curso
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 animate-fade-in">
          <Button variant="outline" size="lg" className="btn-ghost">
            Ver todos os cursos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
});

export { CoursesSection };
