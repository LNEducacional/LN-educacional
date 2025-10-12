import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  emailVerified: boolean;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setAuthState({
        user: response.data,
        loading: false,
        error: null,
      });
    } catch (_error) {
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.post('/auth/login', { email, password });
        setAuthState({
          user: response.data.user,
          loading: false,
          error: null,
        });

        if (response.data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }

        return response.data;
      } catch (error: unknown) {
        const message = error.response?.data?.message || 'Erro ao fazer login';
        setAuthState({
          user: null,
          loading: false,
          error: message,
        });
        throw error;
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.post('/auth/register', { name, email, password });
        setAuthState({
          user: response.data.user,
          loading: false,
          error: null,
        });
        navigate('/dashboard');
        return response.data;
      } catch (error: unknown) {
        const message = error.response?.data?.message || 'Erro ao criar conta';
        setAuthState({
          user: null,
          loading: false,
          error: message,
        });
        throw error;
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      navigate('/login');
    }
  }, [navigate]);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword,
  };
};
