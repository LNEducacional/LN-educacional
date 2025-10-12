import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    console.log('[AUTH] 🔍 Checking authentication...');
    try {
      console.log('[AUTH] 📡 Calling GET /auth/me...');
      const response = await api.get('/auth/me');
      console.log('[AUTH] ✅ Response received:', response.data);
      setUser(response.data);
    } catch (error) {
      console.log('[AUTH] ❌ Authentication check failed:', error.response?.status, error.response?.data);
      setUser(null);
    } finally {
      console.log('[AUTH] ⏱️ Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback(
    async (email: string, password: string, remember = false) => {
      try {
        const response = await api.post('/auth/login', {
          email,
          password,
          remember,
        });

        setUser(response.data.user);

        if (response.data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (error: unknown) {
        const message = error.response?.data?.message || 'Email ou senha inválidos';
        throw new Error(message);
      }
    },
    [navigate]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const response = await api.post('/auth/register', {
          name,
          email,
          password,
        });

        setUser(response.data.user);
        navigate('/dashboard');
      } catch (error: unknown) {
        const message = error.response?.data?.message || 'Erro ao criar conta';
        throw new Error(message);
      }
    },
    [navigate]
  );

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: unknown) {
      const message = error.response?.data?.message || 'Erro ao enviar email de recuperação';
      throw new Error(message);
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      try {
        await api.post('/auth/reset-password', { token, password });
        navigate('/login');
      } catch (error: unknown) {
        const message = error.response?.data?.message || 'Erro ao resetar senha';
        throw new Error(message);
      }
    },
    [navigate]
  );

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await api.put('/student/profile', data);
      setUser(response.data);
    } catch (error: unknown) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      throw new Error(message);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
