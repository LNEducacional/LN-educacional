import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Briefcase,
  Upload,
  Download,
  Eye,
  ExternalLink,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { useCollaboratorProfile } from '@/hooks/useCollaborator';
import { DocumentCard, DocumentList } from '@/components/collaborator/DocumentCard';
import { useToast } from '@/hooks/use-toast';
import { PortalLayout } from '@/components/collaborator/PortalLayout';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const DocumentUploadDialog = ({ isOpen, onClose, type, onUpload }: {
  isOpen: boolean;
  onClose: () => void;
  type: 'resume' | 'portfolio' | 'certificate';
  onUpload: (file: File, metadata: any) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file, { title, description, type });
      onClose();
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'resume':
        return 'Upload de Currículo';
      case 'portfolio':
        return 'Upload de Portfolio';
      case 'certificate':
        return 'Upload de Certificado';
      default:
        return 'Upload de Documento';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTypeTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
            </p>
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do documento"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do documento..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DocumentRequirements = () => {
  const requirements = [
    {
      type: 'resume',
      title: 'Currículo',
      description: 'Documento atualizado com suas experiências profissionais',
      required: true,
      icon: <FileText className="h-5 w-5 text-blue-600" />
    },
    {
      type: 'portfolio',
      title: 'Portfolio',
      description: 'Exemplos dos seus trabalhos (opcional)',
      required: false,
      icon: <Briefcase className="h-5 w-5 text-purple-600" />
    },
    {
      type: 'certificate',
      title: 'Certificados',
      description: 'Certificados de cursos e qualificações (opcional)',
      required: false,
      icon: <FileText className="h-5 w-5 text-green-600" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Necessários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requirements.map((req) => (
            <div key={req.type} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-gray-50 rounded-lg">
                {req.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{req.title}</h4>
                  {req.required ? (
                    <Badge variant="destructive">Obrigatório</Badge>
                  ) : (
                    <Badge variant="secondary">Opcional</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {req.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export function CollaboratorDocuments() {
  const { data: profile, isLoading, error } = useCollaboratorProfile();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'resume' | 'portfolio' | 'certificate'>('resume');

  if (isLoading) return <LoadingSpinner />;

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar dados
            </h2>
            <p className="text-red-600">
              Não foi possível carregar seus documentos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documents = [
    ...(profile.resumeUrl ? [{
      id: 'resume',
      title: 'Currículo',
      url: profile.resumeUrl,
      type: 'resume' as const,
      uploadedAt: profile.createdAt,
      size: '2.1 MB'
    }] : []),
    ...(profile.portfolioUrls || []).map((url, index) => ({
      id: `portfolio-${index}`,
      title: `Portfolio ${index + 1}`,
      url,
      type: 'portfolio' as const,
      uploadedAt: profile.createdAt,
      size: '3.5 MB'
    }))
  ];

  const handleUpload = async (file: File, metadata: any) => {
    // Simular upload - aqui você implementaria a lógica real de upload
    console.log('Uploading:', file, metadata);

    toast({
      title: "Upload realizado com sucesso!",
      description: `${metadata.title} foi enviado com sucesso.`,
    });

    // Aqui você faria uma mutação para atualizar os dados
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', metadata.type);
    // formData.append('title', metadata.title);
    // formData.append('description', metadata.description);
    // await collaboratorService.uploadDocument(formData);
  };

  const openUploadDialog = (type: 'resume' | 'portfolio' | 'certificate') => {
    setUploadType(type);
    setUploadDialogOpen(true);
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 3; // resume (required), portfolio (optional), certificates (optional)

    if (profile.resumeUrl) completed++;
    if (profile.portfolioUrls && profile.portfolioUrls.length > 0) completed++;
    if (profile.linkedin || profile.github) completed++; // Consider social links as "certificates"

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <PortalLayout>
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Meus Documentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus documentos e mantenha seu perfil atualizado
        </p>
      </div>

      {/* Completion Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status dos Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Perfil Completo</span>
                <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {profile.resumeUrl ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">Currículo</span>
              </div>

              <div className="flex items-center gap-2">
                {profile.portfolioUrls && profile.portfolioUrls.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Portfolio</span>
              </div>

              <div className="flex items-center gap-2">
                {profile.linkedin || profile.github ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Links Profissionais</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Adicionar Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => openUploadDialog('resume')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                {profile.resumeUrl ? 'Atualizar Currículo' : 'Enviar Currículo'}
              </Button>

              <Button
                onClick={() => openUploadDialog('portfolio')}
                className="w-full justify-start"
                variant="outline"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Adicionar Portfolio
              </Button>

              <Button
                onClick={() => openUploadDialog('certificate')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Adicionar Certificado
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="text-xs text-muted-foreground">
              <p>• Tamanho máximo: 10MB por arquivo</p>
              <p>• Formatos aceitos: PDF, DOC, DOCX, JPG, PNG</p>
              <p>• Currículo é obrigatório</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <DocumentList
                  documents={documents}
                  emptyMessage="Nenhum documento enviado ainda"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Nenhum documento enviado ainda</p>
                  <p className="text-sm">
                    Comece enviando seu currículo para completar seu perfil
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => openUploadDialog('resume')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Currículo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6">
        <DocumentRequirements />
      </div>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        type={uploadType}
        onUpload={handleUpload}
      />
      </div>
    </PortalLayout>
  );
}