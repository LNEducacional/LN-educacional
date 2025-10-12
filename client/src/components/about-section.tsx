export function AboutSection() {
  const stats = [
    { number: '5mil+', label: 'Trabalhos prontos' },
    { number: '200+', label: 'Cursos disponíveis' },
    { number: '50+', label: 'Especialistas' },
    { number: '15mil+', label: 'Alunos satisfeitos' },
  ];

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Header */}
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Sobre a <span className="text-gradient-primary">LN Educacional</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Há mais de 5 anos, ajudamos estudantes e profissionais a alcançarem seus objetivos
              acadêmicos e profissionais. Nossa plataforma reúne recursos educacionais de qualidade
              e serviços personalizados para cada necessidade.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-card border-2 border-border rounded-xl p-6 text-center space-y-3 shadow-sm hover:shadow-strong transition-all duration-300 card-hover animate-slide-up hover-scale"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary">{stat.number}</div>
                <div className="text-muted-foreground font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
