import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryKeys } from '@/lib/query-client';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { CalendarDays, Download, FileText, Loader2, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DownloadAnalyticsData {
  summary: {
    totalDownloads: number;
    uniqueUsers: number;
    averagePerDay: number;
    period: {
      startDate: string;
      endDate: string;
    };
  };
  charts: {
    dailyDownloads: DailyDownload[];
    downloadsByType: DownloadsByType[];
    downloadsByArea: DownloadsByArea[];
  };
  topItems: TopDownloadedItem[];
  filters: {
    startDate?: string;
    endDate?: string;
    itemType?: string;
    academicArea?: string;
  };
}

interface DailyDownload {
  date: string;
  downloads: number;
}

interface DownloadsByType {
  itemType: string;
  _count: { id: number };
}

interface DownloadsByArea {
  academicArea: string;
  _count: { id: number };
}

interface TopDownloadedItem {
  id: string;
  title: string;
  authorName: string;
  academicArea?: string;
  isFree?: boolean;
  paperType?: string;
  itemType: string;
  downloads: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ACADEMIC_AREAS = [
  { value: 'ADMINISTRATION', label: 'Administração' },
  { value: 'LAW', label: 'Direito' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'ENGINEERING', label: 'Engenharia' },
  { value: 'PSYCHOLOGY', label: 'Psicologia' },
  { value: 'HEALTH', label: 'Saúde' },
  { value: 'ACCOUNTING', label: 'Contabilidade' },
  { value: 'ARTS', label: 'Artes' },
  { value: 'ECONOMICS', label: 'Economia' },
  { value: 'SOCIAL_SCIENCES', label: 'Ciências Sociais' },
  { value: 'OTHER', label: 'Outros' },
];

export default function AnalyticsDownloads() {
  const [dateRange, setDateRange] = useState('30d');
  const [itemType, setItemType] = useState<string>('all');
  const [academicArea, setAcademicArea] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range
  const getDateRange = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }

    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case 'year':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      default:
        start = subDays(end, 30);
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  };

  // Fetch downloads analytics data
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.admin.downloadAnalytics({
      dateRange,
      itemType,
      academicArea,
      customStartDate,
      customEndDate,
    }),
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await api.get('/admin/analytics/downloads', {
        params: {
          startDate,
          endDate,
          ...(itemType && itemType !== 'all' && { itemType }),
          ...(academicArea && academicArea !== 'all' && { academicArea }),
        },
      });
      return response.data as DownloadAnalyticsData;
    },
  });

  // Export data
  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const response = await api.get('/admin/analytics/downloads/export', {
        params: {
          startDate,
          endDate,
          ...(itemType && { itemType }),
          ...(academicArea && { academicArea }),
          format: 'csv',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `downloads-analytics-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setItemType('');
    setAcademicArea('');
    setCustomStartDate('');
    setCustomEndDate('');
    setDateRange('30d');
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
              <div className="flex items-center justify-center min-h-[600px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !analytics) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
              <div className="text-center py-12">
                <p className="text-destructive">Erro ao carregar analytics de downloads</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Downloads</h1>
          <p className="text-muted-foreground">
            Análise detalhada de downloads de trabalhos gratuitos e pagos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Personalize a análise com filtros específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Item</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="PAPER">Trabalhos</SelectItem>
                  <SelectItem value="EBOOK">E-books</SelectItem>
                  <SelectItem value="COURSE_MATERIAL">Material de Curso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Área Acadêmica</Label>
              <Select value={academicArea} onValueChange={setAcademicArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {ACADEMIC_AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ações</Label>
              <Button variant="outline" onClick={handleClearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalDownloads.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Período: {format(new Date(analytics.summary.period.startDate), 'dd/MM')} -{' '}
              {format(new Date(analytics.summary.period.endDate), 'dd/MM')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.uniqueUsers.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários que fizeram pelo menos 1 download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Dia</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.averagePerDay.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Downloads por dia no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Únicos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topItems.length}</div>
            <p className="text-xs text-muted-foreground">Itens diferentes baixados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="types">Por Tipo</TabsTrigger>
          <TabsTrigger value="areas">Por Área</TabsTrigger>
          <TabsTrigger value="top-items">Top Itens</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Downloads ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução diária dos downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analytics.charts.dailyDownloads}>
                  <defs>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd/MM')} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
                    formatter={(value: number) => [value, 'Downloads']}
                  />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorDownloads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Downloads por Tipo de Item</CardTitle>
              <CardDescription>Distribuição de downloads por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.charts.downloadsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.itemType}: ${entry._count.id}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="_count.id"
                    >
                      {analytics.charts.downloadsByType.map((entry, index) => (
                        <Cell key={`cell-${entry.itemType}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.charts.downloadsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="itemType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="_count.id" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Areas Tab */}
        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Downloads por Área Acadêmica</CardTitle>
              <CardDescription>Distribuição por área de conhecimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.charts.downloadsByArea} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="academicArea" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="_count.id" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Items Tab */}
        <TabsContent value="top-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itens Mais Baixados</CardTitle>
              <CardDescription>
                Top {analytics.topItems.length} itens com mais downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topItems.slice(0, 20).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.authorName}</span>
                          <span>•</span>
                          <span>{item.itemType}</span>
                          {item.isFree && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                GRÁTIS
                              </Badge>
                            </>
                          )}
                          {item.academicArea && (
                            <>
                              <span>•</span>
                              <span>
                                {ACADEMIC_AREAS.find((a) => a.value === item.academicArea)?.label ||
                                  item.academicArea}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {item.downloads.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
