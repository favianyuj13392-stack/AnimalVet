import axios from 'axios';
import { toast } from 'sonner';
import {useAuthStore} from "@/shared/store/useAuthStore"; // Para acceder al token desde Zustand si es necesario

const token = useAuthStore.getState().access_token; // Obtener el token directamente del store
let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/animalvet';
if (rawApiUrl.includes('/api/huellitas')) {
  rawApiUrl = rawApiUrl.replace('/api/huellitas', '/api/animalvet');
}
if (rawApiUrl && !rawApiUrl.endsWith('/api/animalvet') && !rawApiUrl.endsWith('/api/animalvet/')) {
  if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1);
  rawApiUrl = `${rawApiUrl}/api/animalvet`;
}

const api = axios.create({
  baseURL: rawApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para peticiones (Agregar Token automáticamente)
api.interceptors.request.use((config) => {
const token = useAuthStore.getState().access_token;
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
  return config;
});

// Interceptor para respuestas (El "Traductor" de errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Ocurrió un error inesperado en AnimalVet";
    
    if (error.response) {
      const backendMessage = error.response.data?.message;
      switch (error.response.status) {
        case 401:
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          const isPasswordVerify = error.config?.url?.includes('/auth/verificar-password');
          if (!isLoginRequest && !isPasswordVerify) {
            message = "Sesión expirada. Por favor, inicia sesión de nuevo.";
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } else {
            message = backendMessage || (isPasswordVerify ? "Contraseña incorrecta." : "Usuario o contraseña incorrectos.");
          }
          break;
        case 403: message = backendMessage || "No tienes permisos para realizar esta acción."; break;
        case 404: message = backendMessage || "El recurso solicitado no existe."; break;
        case 422: message = backendMessage || "Los datos enviados son incorrectos."; break;
        case 500: message = "Error interno del servidor. Reintenta más tarde."; break;
      }
    } else if (error.request) {
      message = "No se pudo conectar con el servidor. Revisa tu internet.";
    }

    toast.error(message); // Notificación automática
    return Promise.reject(error);
  }
);

export default api;