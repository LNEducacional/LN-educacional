import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FileText,
  Gift,
  LogIn,
  MessageCircle,
  MonitorPlay,
  Palette,
  PenTool,
  User,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const desktopNavigationItems = [
  {
    title: 'Cursos Online',
    icon: MonitorPlay,
    href: '/courses',
    description: 'Cursos completos e atualizados em diversas áreas',
  },
  {
    title: 'E-books & Apostilas',
    icon: BookOpen,
    href: '/ebooks',
    description: 'Material de estudo digital de qualidade',
  },
  {
    title: 'Blog',
    icon: PenTool,
    href: '/blog',
    description: 'Artigos, dicas e novidades do mundo acadêmico',
  },
];

const faleConoscoItems = [
  {
    title: 'Entrar em Contato',
    icon: MessageCircle,
    href: '/contact',
    description: 'Entre em contato conosco para mais informações',
  },
  {
    title: 'Seja Colaborador',
    icon: Users,
    href: '/collaborator',
    description: 'Faça parte da nossa equipe de especialistas',
  },
];

const trabalhoItems = [
  {
    title: 'Trabalhos Prontos',
    icon: FileText,
    href: '/ready-papers',
    description: 'Trabalhos acadêmicos já desenvolvidos e prontos para uso',
  },
  {
    title: 'Trabalhos Gratuitos',
    icon: Gift,
    href: '/free-papers',
    description: 'Acesso livre a trabalhos e materiais selecionados',
  },
  {
    title: 'Trabalhos Personalizados',
    icon: Palette,
    href: '/custom-papers',
    description: 'Encomende trabalhos sob medida para suas necessidades',
  },
];

export default function HeaderNavigation() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-6">
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {/* Trabalhos Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-trigger">Trabalhos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[500px] gap-3 p-6">
                {trabalhoItems.map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                          location.pathname === item.href && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-primary" />
                          <div className="text-sm font-medium leading-none">{item.title}</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Direct Links */}
          {desktopNavigationItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  'nav-link',
                  location.pathname === item.href && 'bg-accent text-accent-foreground'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </NavigationMenuItem>
          ))}

          {/* Fale Conosco Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-trigger">Fale Conosco</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-6">
                {faleConoscoItems.map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                          location.pathname === item.href && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-primary" />
                          <div className="text-sm font-medium leading-none">{item.title}</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Auth Buttons */}
      <div className="hidden lg:flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="nav-button">
          <Link to="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Link>
        </Button>
        <Button size="sm" asChild className="btn-accent">
          <Link to="/register">
            <User className="mr-2 h-4 w-4" />
            Cadastrar
          </Link>
        </Button>
      </div>
    </div>
  );
}
