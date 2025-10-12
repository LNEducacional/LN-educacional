import heroImage from '@/assets/hero-illustration.jpg';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Star } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-subtle overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-accent-subtle px-4 py-2 rounded-full">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">
                  Plataforma #1 em Educação Online
                </span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Transforme seu <span className="text-gradient-primary">futuro</span> com educação de{' '}
                <span className="text-gradient-accent">excelência</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Desenvolva suas habilidades com cursos profissionais ministrados por especialistas
                reconhecidos no mercado. Aprenda no seu ritmo e conquiste seus objetivos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="btn-hero group">
                Conheça os Cursos
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button variant="outline" size="lg" className="btn-ghost group">
                <Play className="mr-2 h-5 w-5" />
                Assistir Demonstração
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-slide-up">
            <div className="relative">
              <img
                src={heroImage}
                alt="Plataforma de educação online moderna"
                className="w-full h-auto rounded-2xl shadow-strong"
              />

              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-card border border-border rounded-lg p-2 sm:p-4 shadow-medium animate-scale-in">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full" />
                  <span className="text-xs sm:text-sm font-medium">Ao vivo agora</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-card border border-border rounded-lg p-2 sm:p-4 shadow-medium animate-scale-in">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-accent">4.9</div>
                  <div className="text-xs text-muted-foreground">Avaliação</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
