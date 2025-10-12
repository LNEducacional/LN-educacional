import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';

const footerSections = [
  {
    title: 'Empresa',
    links: [
      { name: 'Sobre nós', href: '#' },
      { name: 'Nossa missão', href: '#' },
      { name: 'Carreiras', href: '#' },
      { name: 'Imprensa', href: '#' },
    ],
  },
  {
    title: 'Cursos',
    links: [
      { name: 'Programação', href: '#' },
      { name: 'Design', href: '#' },
      { name: 'Marketing', href: '#' },
      { name: 'Negócios', href: '#' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { name: 'Central de ajuda', href: '#' },
      { name: 'Contato', href: '#' },
      { name: 'Status do sistema', href: '#' },
      { name: 'Relatório de bugs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Termos de uso', href: '#' },
      { name: 'Política de privacidade', href: '#' },
      { name: 'Cookies', href: '#' },
      { name: 'Reembolso', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="LN Educacional"
                className="h-8 w-8 object-contain"
              />
              <h3 className="text-xl font-bold text-gradient-primary">LN Educacional</h3>
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Transformando vidas através da educação online de qualidade. Aprenda com os melhores e
              alcance seus objetivos profissionais.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-all">contato@lneducacional.com.br</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>São Paulo, SP - Brasil</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="font-semibold text-foreground">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="max-w-md mx-auto sm:mx-0">
            <h4 className="font-semibold mb-2 text-center sm:text-left">Receba novidades</h4>
            <p className="text-muted-foreground text-sm mb-4 text-center sm:text-left">
              Fique por dentro dos novos cursos e promoções exclusivas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
              />
              <button type="button" className="btn-accent whitespace-nowrap">
                Inscrever
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 LN Educacional. Todos os direitos reservados.
          </div>
          <div className="text-sm text-muted-foreground">
            Feito com ❤️ para transformar a educação
          </div>
        </div>
      </div>
    </footer>
  );
}
