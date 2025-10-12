import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockCollaboratorAnalytics } from '@/data/mock-analytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Calendar,
  Target
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

function StatsCard({ title, value, icon, trend, trendColor = 'text-green-600' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className={`text-sm ${trendColor} flex items-center gap-1 mt-1`}>
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 bg-muted rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  interviewing: { label: 'Em Entrevista', variant: 'default' as const },
  approved: { label: 'Aprovado', variant: 'default' as const },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CollaboratorAnalytics() {
  const analytics = mockCollaboratorAnalytics;

  const handleExportReport = () => {
    // Simulate report export
    alert('Relatório de colaboradores exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">Analytics - Colaboradores</CardTitle>
              <CardDescription className="text-lg">
                Métricas e insights sobre o processo de recrutamento de colaboradores
              </CardDescription>
            </div>
            <Button onClick={handleExportReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Aplicações"
          value={analytics.totalApplications}
          icon={<Users className="h-6 w-6" />}
          trend="+12% este mês"
        />
        <StatsCard
          title="Taxa de Aprovação"
          value={`${analytics.approvalRate}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          trend="+3% vs mês anterior"
        />
        <StatsCard
          title="Tempo Médio"
          value={`${analytics.avgTimeToHire} dias`}
          icon={<Clock className="h-6 w-6" />}
          trend="-2 dias"
        />
        <StatsCard
          title="Em Pipeline"
          value={analytics.inPipeline}
          icon={<Target className="h-6 w-6" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aplicações por Mês
            </CardTitle>
            <CardDescription>
              Evolução das candidaturas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.applicationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
            <CardDescription>
              Pipeline de candidatos por etapa do processo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.conversionFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Areas Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Área</CardTitle>
            <CardDescription>
              Candidatos por área de especialização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.areaDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.areaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Score by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Score Médio por Etapa</CardTitle>
            <CardDescription>
              Pontuação média dos candidatos em cada etapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.avgScoreByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Candidatos</CardTitle>
          <CardDescription>
            Candidatos com as melhores pontuações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Área</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{candidate.fullName}</div>
                      <div className="text-sm text-muted-foreground">{candidate.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.area}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        candidate.score && candidate.score >= 8.5
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : candidate.score && candidate.score >= 7.5
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }
                    >
                      {candidate.score}/10
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {candidate.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[candidate.status].variant}>
                      {statusMap[candidate.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(candidate.createdAt), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}