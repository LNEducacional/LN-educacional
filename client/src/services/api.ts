import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // Se não é FormData, define Content-Type como JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // Se é FormData, deixa o axios definir automaticamente como multipart/form-data
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se a requisição original é de autenticação, apenas rejeita sem tentar refresh
    if (
      originalRequest.url?.includes('/auth/me') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // Se erro 401 e não tentou refresh ainda
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenta fazer refresh do token
        await api.post('/auth/refresh');
        // Tenta novamente a requisição original
        return api.request(originalRequest);
      } catch (refreshError) {
        // Se refresh falhar, redireciona para login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
