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
  BookOpen,
  DollarSign,
  GraduationCap,
  Loader2,
  ShoppingBag,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    courses: number;
    orders: number;
    revenue: number;
  };
}

interface AnalyticsData {
  labels: string[];
  sales: number[];
  enrollments: number[];
  completions: number[];
  categories: {
    name: string;
    value: number;
    count: number;
  }[];
}


const CustomLegend = () => (
  <div className="flex flex-wrap gap-4 justify-center mt-4">
    <div className="flex items-center gap-2">
      <UserPlus className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">Matrículas</span>
    </div>
    <div className="flex items-center gap-2">
      <GraduationCap className="h-4 w-4 text-accent" />
      <span className="text-sm font-medium">Conclusões</span>
    </div>
  </div>
);

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
        <p className="font-semibold text-card-foreground mb-3 text-base">{label}</p>
        {payload.map((entry, _index) => (
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

interface PieTooltipPayload {
  payload: {
    name: string;
    value: number;
    color: string;
  };
}

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: PieTooltipPayload[];
}

const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl animate-fade-in min-w-[160px]">
        <p className="font-semibold text-card-foreground mb-3 text-base">{data.name}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Cursos:</span>
            <span className="text-sm font-semibold text-foreground">{data.count}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Percentual:</span>
            <span className="text-sm font-semibold text-foreground">{data.value}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const [period, setPeriod] = useState('7d');

  // Buscar estatísticas do dashboard
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/admin/dashboard/stats');

  // Buscar analytics com período
  const { data: analytics, loading: analyticsLoading } = useApi<AnalyticsData>(
    `/admin/analytics?period=${period}`,
    { dependencies: [period] }
  );

  const loading = statsLoading || analyticsLoading;

  const dashboardStats = stats
    ? [
        {
          title: 'Total de Usuários',
          value: (stats.totalUsers ?? 0).toLocaleString('pt-BR'),
          change: `${(stats.monthlyGrowth?.users ?? 0) > 0 ? '+' : ''}${stats.monthlyGrowth?.users ?? 0}%`,
          icon: Users,
          color: 'text-primary',
        },
        {
          title: 'Cursos Ativos',
          value: (stats.totalCourses ?? 0).toLocaleString('pt-BR'),
          change: `${(stats.monthlyGrowth?.courses ?? 0) > 0 ? '+' : ''}${stats.monthlyGrowth?.courses ?? 0}%`,
          icon: BookOpen,
          color: 'text-accent',
        },
        {
          title: 'Total de Pedidos',
          value: (stats.totalOrders ?? 0).toLocaleString('pt-BR'),
          change: `${(stats.monthlyGrowth?.orders ?? 0) > 0 ? '+' : ''}${stats.monthlyGrowth?.orders ?? 0}%`,
          icon: ShoppingBag,
          color: 'text-primary',
        },
        {
          title: 'Receita Total',
          value: ((stats.totalRevenue ?? 0) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          change: `${(stats.monthlyGrowth?.revenue ?? 0) > 0 ? '+' : ''}${stats.monthlyGrowth?.revenue ?? 0}%`,
          icon: DollarSign,
          color: 'text-accent',
        },
      ]
    : [];

  const monthlyData = analytics?.labels
    ? analytics.labels.map((label, index) => ({
        month: label,
        vendas: analytics.sales?.[index] ?? 0,
        matriculas: analytics.enrollments?.[index] ?? 0,
        conclusoes: analytics.completions?.[index] ?? 0,
      }))
    : [];

  const categoryData = analytics?.categories || [];
  const totalCourses = categoryData.reduce((sum, item) => sum + (item.count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das métricas da plataforma</p>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, _index) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-accent font-medium">
                {stat.change} em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Barras Moderno */}
        <Card className="card-hover overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Matrículas vs Conclusões</CardTitle>
            <CardDescription className="text-muted-foreground">
              Comparativo mensal de matrículas e conclusões de cursos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomLegend />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="matriculas" fill="#1e40af" radius={[8, 8, 0, 0]} maxBarSize={50} />
                <Bar dataKey="conclusoes" fill="#FFD700" radius={[8, 8, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Donut Moderno */}
        <Card className="card-hover overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Distribuição por Categoria</CardTitle>
            <CardDescription className="text-muted-foreground">
              Percentual de cursos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    startAngle={90}
                    endAngle={450}
                  >
                    {categoryData.map((entry, _index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={entry.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro do Donut - Posicionamento Absoluto Preciso */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="animate-fade-in">
                  <div className="text-4xl font-bold text-foreground mb-1">{totalCourses}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total de Cursos</div>
                </div>
              </div>
            </div>

            {/* Legenda Personalizada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {categoryData.map((entry, _index) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-105"
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-sm border-2 border-background"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {entry.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.count} cursos • {entry.value}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
