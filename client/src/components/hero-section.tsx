import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Camada 1: Imagem de fundo */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Camada 2: Overlay preto 65% */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
        }}
      />

      {/* Camada 3: Conteúdo */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              {/* Nome da empresa */}
              <p className="text-lg sm:text-xl font-semibold text-white tracking-wide">
                LN Educacional
              </p>

              {/* Slogan principal */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-white tracking-tight">
                JUNTOS SOMOS A EVOLUÇÃO
              </h1>

              {/* Subtítulo */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
                Transforme sua jornada acadêmica com a LN Educacional
              </h2>

              {/* Descrição */}
              <p className="text-lg sm:text-xl text-gray-100 leading-relaxed max-w-3xl mx-auto">
                Trabalhos prontos, cursos online e todo o suporte que você precisa para se destacar
                nos estudos.
              </p>
            </div>

            <div className="flex justify-center">
              <Button size="lg" className="btn-hero group" asChild>
                <Link to="/courses">
                  Conheça os Cursos
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
