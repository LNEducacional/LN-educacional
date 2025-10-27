import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';

export const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('[AdminRoute] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[AdminRoute] User:', user.email, 'Role:', user.role);

  if (user.role !== 'ADMIN') {
    console.log('[AdminRoute] Not ADMIN, redirecting...');
    // Redireciona STUDENT para dashboard de aluno
    if (user.role === 'STUDENT') {
      return <Navigate to="/dashboard" replace />;
    }
    // Redireciona outros roles para home
    return <Navigate to="/" replace />;
  }

  console.log('[AdminRoute] ADMIN confirmed, allowing access');
  return <Outlet />;
};

export const StudentRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('[StudentRoute] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[StudentRoute] User:', user.email, 'Role:', user.role);

  if (user.role !== 'STUDENT') {
    console.log('[StudentRoute] Not STUDENT, redirecting...');
    // Redireciona ADMIN para o painel administrativo
    if (user.role === 'ADMIN') {
      console.log('[StudentRoute] ADMIN detected, redirecting to /admin');
      return <Navigate to="/admin" replace />;
    }
    // Redireciona outros roles para a home
    console.log('[StudentRoute] Other role, redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('[StudentRoute] STUDENT confirmed, allowing access');
  return <Outlet />;
};
