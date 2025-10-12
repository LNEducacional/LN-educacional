import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';
import {
  BarChart3,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BlogAnalyticsData {
  period: string;
  totalStats: {
    views: number;
    uniqueViews: number;
    shares: number;
  };
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    shares: number;
    publishedAt: string;
    author: {
      name: string;
    };
  }>;
  dailyAnalytics: Array<{
    date: string;
    views: number;
    uniqueViews: number;
    shares: number;
  }>;
}

interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl animate-fade-in">
        <p className="font-semibold text-card-foreground mb-3 text-base">
          {new Date(label!).toLocaleDateString('pt-BR')}
        </p>
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 mb-2 last:mb-0"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground capitalize">{entry.dataKey}:</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  description
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  description?: string;
}) => (
  <Card className="card-hover">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

export function BlogAnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');

  const { data: analytics, loading } = useApi<BlogAnalyticsData>(
    `/admin/analytics/blog-overview?period=${period}`,
    { dependencies: [period] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  const formatPeriodLabel = (period: string) => {
    const labels = {
      '7d': 'Últimos 7 dias',
      '30d': 'Últimos 30 dias',
      '90d': 'Últimos 90 dias',
      '1y': 'Último ano',
    };
    return labels[period as keyof typeof labels] || period;
  };

  const chartData = analytics.dailyAnalytics.map((day) => ({
    date: day.date,
    visualizações: day.views,
    'visualizações únicas': day.uniqueViews,
    compartilhamentos: day.shares,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics do Blog</h1>
          <p className="text-muted-foreground">
            Métricas de performance e engajamento dos posts
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total de Visualizações"
          value={analytics.totalStats.views.toLocaleString('pt-BR')}
          icon={Eye}
          color="text-primary"
          description={formatPeriodLabel(period)}
        />
        <StatCard
          title="Visualizações Únicas"
          value={analytics.totalStats.uniqueViews.toLocaleString('pt-BR')}
          icon={TrendingUp}
          color="text-accent"
          description={formatPeriodLabel(period)}
        />
        <StatCard
          title="Total de Compartilhamentos"
          value={analytics.totalStats.shares.toLocaleString('pt-BR')}
          icon={Share2}
          color="text-green-600"
          description={formatPeriodLabel(period)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Linha - Performance Diária */}
        <Card className="card-hover overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Diária
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Evolução das métricas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="visualizações"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#1e40af', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="visualizações únicas"
                  stroke="#FFD700"
                  strokeWidth={3}
                  dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#FFD700', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="compartilhamentos"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Posts Mais Populares
            </CardTitle>
            <CardDescription>
              Posts com maior número de visualizações no período
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPosts.slice(0, 6).map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    por {post.author.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Eye className="h-3 w-3" />
                    {post.views.toLocaleString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Share2 className="h-3 w-3" />
                    {post.shares}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras - Comparativo Semanal */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Comparativo de Métricas</CardTitle>
          <CardDescription>
            Visualizações vs Compartilhamentos por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="visualizações"
                fill="#1e40af"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="compartilhamentos"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}