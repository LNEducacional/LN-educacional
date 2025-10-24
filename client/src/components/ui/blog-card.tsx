import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  coverImageUrl?: string;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const _handleReadMore = () => {
    // This will be handled by the Link component
  };

  if (featured) {
    return (
      <Card className="overflow-hidden shadow-medium hover:shadow-strong transition-all duration-300 group">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-64 lg:h-full overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-6xl opacity-20">📚</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              {/* Category */}
              {post.category && (
                <div className="mb-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {post.category.name}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                {post.author && (
                  <div className="text-sm text-muted-foreground">Por {post.author.name}</div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(post.createdAt)}
                </div>
              </div>

              <CardTitle className="text-3xl mb-4 leading-tight group-hover:text-primary transition-colors">
                {post.title}
              </CardTitle>

              <CardDescription className="text-base mb-6 leading-relaxed">
                {post.excerpt}
              </CardDescription>

              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4 mr-1" />
                {Math.ceil(post.content.length / 1500)} min de leitura
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map(({ tag }) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button asChild className="w-fit bg-primary hover:bg-primary-hover group/btn">
              <Link to={`/blog/${post.slug}`}>
                Ler artigo completo
                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`} className="block h-full">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full flex flex-col border-border/50">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-muted">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <span className="text-5xl opacity-20">📖</span>
            </div>
          )}

          {/* Category Badge on Image */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground text-xs">
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <CardTitle className="text-lg mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2 font-semibold">
            {post.title}
          </CardTitle>

          <CardDescription className="text-sm mb-4 leading-relaxed line-clamp-2 flex-1">
            {post.excerpt}
          </CardDescription>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{Math.ceil(post.content.length / 1500)} min</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
