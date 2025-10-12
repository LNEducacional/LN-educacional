import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Save, FileText, Clock, User } from 'lucide-react';

interface LegalDocument {
  id: string;
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COOKIES_POLICY' | 'LGPD_COMPLIANCE';
  title: string;
  content: string;
  version: string;
  active: boolean;
  publishedBy: string;
  createdAt: string;
  updatedAt: string;
}

const LEGAL_TYPES = {
  TERMS_OF_SERVICE: 'Termos de Serviço',
  PRIVACY_POLICY: 'Política de Privacidade',
  COOKIES_POLICY: 'Política de Cookies',
  LGPD_COMPLIANCE: 'Conformidade LGPD',
};

export default function LegalEditor() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentDocument, setCurrentDocument] = useState<LegalDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    // Here we would normally fetch the current document of this type
    // For now, we'll set some placeholder content
    setTitle(LEGAL_TYPES[type as keyof typeof LEGAL_TYPES]);
    setContent(`# ${LEGAL_TYPES[type as keyof typeof LEGAL_TYPES]}

## 1. Introdução

Este documento define os termos e condições para ${LEGAL_TYPES[type as keyof typeof LEGAL_TYPES].toLowerCase()}.

## 2. Definições

[Adicione suas definições aqui]

## 3. Termos Principais

[Adicione o conteúdo principal aqui]

## 4. Responsabilidades

[Defina as responsabilidades aqui]

## 5. Disposições Finais

[Adicione as disposições finais aqui]

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}
**Versão:** 1.0.0
`);
  };

  const handleSave = async () => {
    if (!selectedType || !title.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Here we would make an API call to save the document
      // await legalService.createOrUpdateDocument({ type: selectedType, title, content });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Documento salvo',
        description: 'O documento legal foi salvo com sucesso.',
      });

      // Update current document state
      setCurrentDocument({
        id: 'mock-id',
        type: selectedType as any,
        title,
        content,
        version: `v${Date.now()}`,
        active: true,
        publishedBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const renderPreview = () => {
    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Editor de Documentos Legais</h1>
        <p className="text-muted-foreground">
          Crie e edite documentos legais como termos de serviço, políticas de privacidade, etc.
        </p>
      </div>

      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Documento</CardTitle>
          <CardDescription>
            Escolha o tipo de documento legal que deseja editar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEGAL_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentDocument && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Última atualização: {new Date(currentDocument.updatedAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Versão: {currentDocument.version}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Edite o conteúdo do documento selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Título do Documento</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do documento"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo do documento..."
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suporte a Markdown básico. Use # para títulos, ## para subtítulos, etc.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Pré-visualização do documento legal
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {renderPreview()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}