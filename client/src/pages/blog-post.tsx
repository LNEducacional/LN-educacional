import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import blogService, { type BlogPost } from '@/services/blog.service';
import MetaTags from '@/components/seo/meta-tags';
import { ArticleStructuredData } from '@/components/seo/structured-data';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Facebook,
  Linkedin,
  Loader2,
  Share2,
  Twitter,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await blogService.getPostBySlug(slug);
      setPost(data);
    } catch (err: unknown) {
      console.error('Error loading blog post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar o post';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o post do blog',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleBackToBlog = () => {
    navigate('/blog');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link copiado!',
          description: 'O link do artigo foi copiado para a área de transferência.',
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Post não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'O post que você está procurando não existe ou foi removido.'}
            </p>
            <Button onClick={handleBackToBlog}>Voltar para o Blog</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      {post && (
        <>
          <MetaTags
            title={post.metaTitle || post.title}
            description={post.metaDescription || post.excerpt || post.content.substring(0, 160)}
            keywords={post.metaKeywords}
            ogImage={post.ogImage || post.coverImageUrl}
            canonicalUrl={post.canonicalUrl || `${window.location.origin}/blog/${post.slug}`}
            type="article"
            publishedTime={post.publishedAt || post.createdAt}
            modifiedTime={post.updatedAt}
            author={post.author.name}
          />
          <ArticleStructuredData
            title={post.title}
            description={post.excerpt || post.content.substring(0, 200)}
            author={{
              name: post.author.name,
              email: post.author.email,
            }}
            publishedAt={post.publishedAt || post.createdAt}
            modifiedAt={post.updatedAt}
            image={post.coverImageUrl}
            url={`${window.location.origin}/blog/${post.slug}`}
            category={post.category?.name}
            keywords={post.metaKeywords}
            readingTime={post.readingTime}
          />
        </>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToBlog}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Blog
          </Button>
        </div>

        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {post.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Por {post.author.name}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.createdAt)}
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {calculateReadTime(post.content)} min de leitura
                </div>

                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} visualizações
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            {post.coverImageUrl && (
              <div className="w-full h-64 lg:h-96 rounded-lg overflow-hidden bg-muted mb-8">
                <img
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </header>

          {/* Share Buttons */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            <span className="text-sm text-muted-foreground">Compartilhar:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                className="h-8 w-8"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('twitter')}
                className="h-8 w-8"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('linkedin')}
                className="h-8 w-8"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('copy')}
                className="h-8 w-8"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="article-content">
              {post.content.split('\n').map((paragraph, index) =>
                paragraph.trim() ? (
                  <p key={`paragraph-${index}-${paragraph.slice(0, 20)}`} className="mb-4">
                    {paragraph}
                  </p>
                ) : null
              )}
            </div>
          </div>

          {/* Author Info */}
          {post.author && (
            <div className="mt-12 p-6 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Sobre o autor</h3>
              <p className="text-muted-foreground">
                <strong>{post.author.name}</strong> - {post.author.email}
              </p>
            </div>
          )}

          {/* Related Posts Section */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-2xl font-bold mb-6">Artigos Relacionados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Related posts will be loaded here */}
              <Card className="p-4">
                <p className="text-muted-foreground">Em breve: artigos relacionados</p>
              </Card>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
