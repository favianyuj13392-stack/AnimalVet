import axios from 'axios';
import { toast } from 'sonner';
import {useAuthStore} from "@/shared/store/useAuthStore"; // Para acceder al token desde Zustand si es necesario

const token = useAuthStore.getState().access_token; // Obtener el token directamente del store
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/huellitas',
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
    let message = "Ocurrió un error inesperado en Huellitas";
    
    if (error.response) {
      switch (error.response.status) {
        case 401: message = "Sesión expirada. Por favor, inicia sesión de nuevo."; break;
        case 403: message = "No tienes permisos para realizar esta acción."; break;
        case 404: message = "El recurso solicitado no existe."; break;
        case 422: message = "Los datos enviados son incorrectos."; break;
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