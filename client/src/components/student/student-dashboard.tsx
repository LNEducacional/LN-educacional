import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Library,
  Loader2,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  totalOrders: number;
  libraryItems: number;
  totalHours: number;
  averageProgress: number;
}

interface RecentCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  lastAccessed: string;
  thumbnailUrl?: string;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  icon?: string;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    data: dashboardData,
    loading,
    error,
  } = useApi<{
    stats: DashboardStats;
    recentCourses: RecentCourse[];
    recentActivities: RecentActivity[];
  }>('/student/dashboard');
  const stats = dashboardData
    ? [
        {
          title: 'Cursos Matriculados',
          value: dashboardData.stats.enrolledCourses?.toString() || '0',
          icon: BookOpen,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        },
        {
          title: 'Progresso Médio',
          value: `${dashboardData.stats.averageProgress ?? 0}%`,
          icon: TrendingUp,
          color: 'text-accent',
          bgColor: 'bg-accent/10',
        },
        {
          title: 'Certificados',
          value: dashboardData.stats.certificates?.toString() || '0',
          icon: Award,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-amber-500/10',
        },
        {
          title: 'Biblioteca',
          value: dashboardData.stats.libraryItems?.toString() || '0',
          icon: Library,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
      ]
    : [];

  const recentCourses = dashboardData?.recentCourses || [];

  const recentActivities = dashboardData?.recentActivities || [];

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
        <p className="text-muted-foreground">Erro ao carregar o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.name}! Continue sua jornada de aprendizado.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Continuar Estudando
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/student/courses/${course.id}`)}
              >
                <img
                  src={course.thumbnailUrl || '/placeholder-course.jpg'}
                  alt={course.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{course.title}</h4>
                  <p className="text-sm text-muted-foreground">{course.instructor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={course.progress} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{course.progress}%</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {course.lastAccessed}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-accent/30"
              >
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20">
                  {activity.type === 'certificate' ? (
                    <Award className="h-4 w-4 text-amber-500" />
                  ) : activity.type === 'course_completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
