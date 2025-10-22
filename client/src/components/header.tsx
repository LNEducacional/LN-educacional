import { CartDrawer } from '@/components/cart/cart-drawer';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronDown,
  FileText,
  Gift,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  MonitorPlay,
  Palette,
  PenTool,
  ShoppingCart,
  User,
  UserCheck,
  UserX,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';
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

const mobileNavigationItems = [
  {
    title: 'Trabalhos Prontos',
    icon: FileText,
    href: '/ready-papers',
    description: 'Trabalhos acadêmicos já desenvolvidos e prontos para uso',
  },
  {
    title: 'Trabalhos Personalizados',
    icon: Palette,
    href: '/custom-papers',
    description: 'Encomende trabalhos sob medida para suas necessidades',
  },
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
    title: 'Trabalhos Gratuitos',
    icon: Gift,
    href: '/free-papers',
    description: 'Acesso livre a trabalhos e materiais selecionados',
  },
  {
    title: 'Blog',
    icon: PenTool,
    href: '/blog',
    description: 'Artigos, dicas e novidades do mundo acadêmico',
  },
  {
    title: 'Seja Colaborador',
    icon: Users,
    href: '/collaborator',
    description: 'Faça parte da nossa equipe de especialistas',
  },
  {
    title: 'Contato',
    icon: MessageCircle,
    href: '/contact',
    description: 'Entre em contato conosco para mais informações',
  },
];

interface HeaderProps {
  showSearch?: boolean;
  showNotifications?: boolean;
}

export function Header({ showSearch = true, showNotifications = true }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const displaySearch = showSearch && !isHome;
  const displayNotifications = showNotifications && !isHome;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-soft">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="LN Educacional"
            className="h-8 w-8 object-contain"
          />
          <h1 className="text-xl font-bold text-gradient-primary">LN Educacional</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Trabalhos Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) button.click();
                }}
              >
                <Button
                  variant="ghost"
                  className="group relative text-foreground hover:text-primary transition-all duration-300 hover:bg-accent-subtle/50 focus:bg-accent-subtle/50 after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-1/2 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
                >
                  <FileText className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
                  Trabalhos
                  <ChevronDown className="h-3 w-3 ml-0.5 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
              {trabalhoItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Other Navigation Items */}
          {desktopNavigationItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className="group relative text-foreground hover:text-primary transition-all duration-300 hover:bg-accent-subtle/50 focus:bg-accent-subtle/50 after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-1/2 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
                {item.title}
              </Link>
            </Button>
          ))}

          {/* Fale Conosco Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) button.click();
                }}
              >
                <Button
                  variant="ghost"
                  className="group relative text-foreground hover:text-primary transition-all duration-300 hover:bg-accent-subtle/50 focus:bg-accent-subtle/50 after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-1/2 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
                >
                  <MessageCircle className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
                  Fale Conosco
                  <ChevronDown className="h-3 w-3 ml-0.5 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
              {faleConoscoItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {displayNotifications && <NotificationCenter />}

          {/* Cart Icon */}
          <CartDrawer>
            <Button variant="ghost" size="icon" className="relative" data-cart-icon>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </CartDrawer>

          {/* Authentication Status Button - Desktop */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground border border-primary/20 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="relative">
                    <User className="h-4 w-4 text-green-500" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse ring-2 ring-background" />
                  </div>
                  <span className="font-medium">{user.name.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={user.role === 'ADMIN' ? '/admin/profile' : '/student/profile'} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground border border-primary/20 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link to="/login">
                <div className="relative">
                  <User className="h-4 w-4 text-red-500" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
                </div>
                <span className="font-medium">Entrar</span>
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="LN Educacional"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-lg font-bold text-gradient-primary">LN Educacional</span>
                </SheetTitle>
                <SheetDescription>
                  Menu de navegação
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-4">

                <nav className="space-y-2">
                  {mobileNavigationItems.map((item) =>
                    item.href.startsWith('#') ? (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent-subtle/50 transition-all duration-300 group"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110" />
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent-subtle/50 transition-all duration-300 group"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5 transition-transform group-hover:scale-110" />
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </Link>
                    )
                  )}
                </nav>

                {/* Authentication Status Button - Mobile */}
                <div className="pt-4 border-t border-border space-y-2">
                  {user ? (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-hover rounded-lg border border-primary/20 shadow-soft">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative">
                            <User className="h-5 w-5 text-green-500" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse ring-2 ring-primary" />
                          </div>
                          <span className="font-semibold text-primary-foreground">Conta Ativa</span>
                        </div>
                        <p className="text-sm font-medium text-primary-foreground">{user.name}</p>
                        <p className="text-xs text-primary-foreground/80">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full btn-accent"
                        asChild
                      >
                        <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setIsOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setIsOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-hover rounded-lg border border-primary/20 shadow-soft mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <User className="h-5 w-5 text-red-500" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-primary" />
                          </div>
                          <span className="font-semibold text-primary-foreground">Sem Login</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full btn-accent"
                        asChild
                      >
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
                          Entrar na Conta
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
