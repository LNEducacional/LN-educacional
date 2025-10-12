import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, MessageCircle, Heart, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import blogService, { BlogPost } from '@/services/blog.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RelatedPostsProps {
  postId: string;
  limit?: number;
  className?: string;
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Category and Tags */}
          <div className="flex flex-wrap gap-1">
            {post.category && (
              <Badge variant="secondary" className="text-xs">
                {post.category.name}
              </Badge>
            )}
            {post.tags?.slice(0, 2).map((tagRef) => (
              <Badge
                key={tagRef.tag.id}
                variant="outline"
                className="text-xs"
              >
                {tagRef.tag.name}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <Link
            to={`/blog/${post.slug}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="font-semibold text-sm line-clamp-2 leading-relaxed">
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Author and Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Por {post.author?.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{post.views}</span>
            </div>
            {post._count && (
              <>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post._count.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>{post._count.likes}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedPostSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RelatedPosts({
  postId,
  limit = 4,
  className
}: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { posts } = await blogService.getRelatedPosts(postId, limit);
        setRelatedPosts(posts);
      } catch (err) {
        console.error('Error loading related posts:', err);
        setError('Erro ao carregar posts relacionados');
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedPosts();
  }, [postId, limit]);

  if (error) {
    return null; // Silently fail for related posts
  }

  if (!isLoading && relatedPosts.length === 0) {
    return null; // Don't show anything if no related posts
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Posts Relacionados</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: Math.min(4, limit) }).map((_, index) => (
              <RelatedPostSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {relatedPosts.map((post) => (
              <RelatedPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Alternative compact version for sidebars
export function CompactRelatedPosts({
  postId,
  limit = 3,
  className
}: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        setIsLoading(true);
        const { posts } = await blogService.getRelatedPosts(postId, limit);
        setRelatedPosts(posts);
      } catch (err) {
        console.error('Error loading related posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedPosts();
  }, [postId, limit]);

  if (!isLoading && relatedPosts.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Você também pode gostar</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {relatedPosts.map((post) => (
              <div key={post.id} className="space-y-2">
                <Link
                  to={`/blog/${post.slug}`}
                  className="block hover:text-primary transition-colors"
                >
                  <h4 className="font-medium text-sm line-clamp-2 leading-relaxed">
                    {post.title}
                  </h4>
                </Link>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.views}</span>
                  </div>
                  {post._count && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post._count.comments}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}