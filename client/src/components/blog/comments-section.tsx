import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MessageCircle, Reply, Send, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import blogService, { Comment, CreateCommentDto } from '@/services/blog.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentsSectionProps {
  postId: string;
  commentsCount?: number;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, onReply, isReply = false }: CommentItemProps) {
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </span>
            {comment.parent && (
              <Badge variant="secondary" className="text-xs">
                Resposta
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
            {comment._count && comment._count.replies > 0 && (
              <span className="text-xs text-muted-foreground">
                {comment._count.replies} resposta{comment._count.replies > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel
}: {
  postId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Por favor, escreva um comentário');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    setIsSubmitting(true);

    try {
      const commentData: CreateCommentDto = {
        content: content.trim(),
        postId,
        ...(parentId && { parentId }),
      };

      await blogService.createComment(commentData);

      toast.success(
        parentId ? 'Resposta enviada com sucesso!' : 'Comentário enviado com sucesso!'
      );

      setContent('');
      onSuccess();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Erro ao enviar comentário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Faça login
            </a>
            {' '}para deixar um comentário
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={
                  parentId
                    ? 'Escreva sua resposta...'
                    : 'Deixe seu comentário...'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {parentId && onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CommentsSection({ postId, commentsCount = 0 }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const { comments: commentsData } = await blogService.getCommentsByPostId(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleCommentSuccess = () => {
    loadComments();
    setReplyingTo(null);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(replyingTo === parentId ? null : parentId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CommentForm
            postId={postId}
            onSuccess={handleCommentSuccess}
          />

          <Separator />

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando comentários...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Seja o primeiro a comentar!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onReply={handleReply}
                  />

                  {replyingTo === comment.id && (
                    <div className="ml-11 mt-4">
                      <CommentForm
                        postId={postId}
                        parentId={comment.id}
                        onSuccess={handleCommentSuccess}
                        onCancel={() => setReplyingTo(null)}
                      />
                    </div>
                  )}

                  <Separator className="mt-6" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}