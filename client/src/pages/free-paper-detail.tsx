import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { academicAreaLabels, mockPapers, paperTypeLabels } from '@/data/mock-papers';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Download, Eye, User } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function FreePaperDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const paper = mockPapers.find((p) => p.id === Number.parseInt(id || '0', 10) && p.price === 0);

  const handleDownload = () => {
    // Simular verificação de login
    const isLoggedIn = false; // Substituir por lógica real de autenticação

    if (!isLoggedIn) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para baixar este trabalho gratuito.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Download iniciado!',
      description: 'Seu arquivo está sendo baixado.',
    });
  };

  // SEO Meta Tags
  useEffect(() => {
    if (paper) {
      document.title = `${paper.title} - Trabalhos Gratuitos - LN Educacional`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', paper.description.substring(0, 160));
      }
    }
  }, [paper]);

  if (!paper) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Trabalho não encontrado</h1>
          <Button asChild>
            <Link to="/free-papers">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Trabalhos Gratuitos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Mock de estatísticas
  const mockStats = {
    downloads: Math.floor(Math.random() * 1000) + 100,
    views: Math.floor(Math.random() * 5000) + 500,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/free-papers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Trabalhos Gratuitos
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Imagem/Thumbnail */}
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                <img
                  src={paper.thumbnailUrl || '/placeholder.svg'}
                  alt={paper.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Título e Badges */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{paper.title}</h1>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="default">{paperTypeLabels[paper.paperType]}</Badge>
                  <Badge variant="secondary">{paper.pageCount} páginas</Badge>
                  <Badge variant="outline">{academicAreaLabels[paper.academicArea]}</Badge>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Gratuito
                  </Badge>
                </div>
              </div>

              {/* Informações do Autor e Data */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{paper.authorName}</p>
                    <p className="text-sm text-muted-foreground">Autor</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {paper.createdAt.toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">Data de publicação</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {mockStats.downloads}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Eye className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{mockStats.views}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Visualizações</p>
                  </CardContent>
                </Card>
              </div>

              {/* Descrição Completa */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Sobre este trabalho</h2>
                <p className="text-muted-foreground leading-relaxed">{paper.description}</p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Este trabalho acadêmico está disponível gratuitamente como parte do nosso
                  compromisso com a democratização do conhecimento. O conteúdo foi cuidadosamente
                  revisado e pode ser utilizado para fins educacionais e de pesquisa.
                </p>
              </div>

              {/* Tags/Palavras-chave */}
              {paper.keywords && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">Palavras-chave</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.split(', ').map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Box de Download */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-green-600 dark:text-green-400">
                  Gratuito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Trabalho
                </Button>

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>✅ Acesso imediato</p>
                  <p>✅ Sem custos</p>
                  <p>✅ Login necessário</p>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2">Detalhes do arquivo:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Formato: PDF</li>
                    <li>• Páginas: {paper.pageCount}</li>
                    <li>• Idioma: {paper.language}</li>
                    <li>• Tamanho: ~{Math.floor(paper.pageCount * 0.1)}MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Card informativo */}
            <Card className="mt-6 bg-muted/50 border-border">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">💡 Dica</h4>
                <p className="text-sm text-muted-foreground">
                  Gostou deste conteúdo? Explore nossa biblioteca com mais trabalhos gratuitos e
                  trabalhos prontos para compra.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/free-papers">Mais Gratuitos</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/ready-papers">Trabalhos Prontos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
