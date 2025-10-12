import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi } from '@/hooks/use-api';
import api from '@/services/api';
import {
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Medal,
  QrCode,
  Share2,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  completedAt: string;
  certificateNumber: string;
  validationUrl: string;
  downloadUrl?: string;
  instructor: string;
  workload: number;
  grade?: number;
}

export function StudentCertificates() {
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const { data: certificates, loading, error } = useApi<Certificate[]>('/student/certificates');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar certificados</p>
      </div>
    );
  }

  // Garantir que certificates seja um array
  const certificatesArray = Array.isArray(certificates) ? certificates : [];

  const stats = [
    {
      label: 'Certificados Conquistados',
      value: certificatesArray.length || 0,
      icon: Award,
      color: 'text-primary',
    },
    {
      label: 'Média de Notas',
      value: certificatesArray.length
        ? Math.round(
            certificatesArray.reduce((acc, cert) => acc + (cert.grade || 0), 0) / certificatesArray.length
          )
        : 0,
      icon: Trophy,
      color: 'text-amber-500',
    },
    {
      label: 'Último Certificado',
      value:
        certificatesArray.length && certificatesArray[0]
          ? new Date(certificatesArray[0].completedAt).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })
          : 'Nenhum',
      icon: Medal,
      color: 'text-emerald-500',
    },
  ];

  const getGradeBadge = (grade?: number) => {
    if (!grade) return null;
    if (grade >= 90)
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
          Excelente
        </Badge>
      );
    if (grade >= 80)
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
          Muito Bom
        </Badge>
      );
    if (grade >= 70)
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
          Bom
        </Badge>
      );
    return <Badge variant="secondary">Regular</Badge>;
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      const response = await api.get(`/student/certificates/${certificate.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificado-${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
    }
  };

  const handleShowQRCode = async (certificateId: string) => {
    try {
      const response = await api.get(`/student/certificates/${certificateId}/qr`);
      setShowQRCode(response.data.qrCode);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const handleShare = (certificate: Certificate) => {
    const shareText = `Concluí o curso "${certificate.courseTitle}" na LN Educacional! Certificado: ${certificate.certificateNumber}`;
    const shareUrl = certificate.validationUrl;

    if (navigator.share) {
      navigator.share({
        title: 'Meu Certificado',
        text: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Certificados</h1>
        <p className="text-muted-foreground">Visualize e baixe seus certificados de conclusão</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/20">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Certificates Grid */}
      {certificatesArray.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificatesArray.map((certificate) => (
            <Card key={certificate.id} className="hover-scale overflow-hidden">
              {/* Certificate Header */}
              <div className="bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="p-2 bg-white/20 rounded-lg w-fit">
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg">Certificado de Conclusão</h3>
                  </div>
                  {getGradeBadge(certificate.grade)}
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Course Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">{certificate.courseTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    Instrutor: {certificate.instructor}
                  </p>
                </div>

                {/* Certificate Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Concluído em {new Date(certificate.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {certificate.grade && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>Nota: {certificate.grade}/100</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>Carga horária: {certificate.workload}h</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nº: {certificate.certificateNumber}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowQRCode(certificate.id)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(certificate)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  <Button className="w-full" size="sm" onClick={() => handleDownload(certificate)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Certificado
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    size="sm"
                    onClick={() => window.open(certificate.validationUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verificar Autenticidade
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum certificado ainda</h3>
          <p className="text-muted-foreground">
            Complete seus cursos para receber certificados de conclusão.
          </p>
        </div>
      )}

      {/* Verification Info */}
      <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Certificados Verificáveis
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Todos os nossos certificados são digitalmente verificáveis e reconhecidos no
                mercado. Use o link de verificação para comprovar a autenticidade do seu
                certificado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQRCode && (
        <dialog
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRCode(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowQRCode(null);
            }
          }}
          aria-modal="true"
          tabIndex={-1}
          open
        >
          <Card className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>QR Code do Certificado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <img src={showQRCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Escaneie o código para verificar a autenticidade do certificado
              </p>
              <Button variant="outline" className="w-full" onClick={() => setShowQRCode(null)}>
                Fechar
              </Button>
            </CardContent>
          </Card>
        </dialog>
      )}
    </div>
  );
}
