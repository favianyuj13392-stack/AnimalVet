import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Así es exactamente como viene del backend
export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  avatar_url?: string | null;
  rol: {
    id: number;
    nombre: string;
  };
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  setLogin: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      setLogin: (user, access_token) => {
  set({ user, access_token });
  // Seteamos la cookie para que el middleware de Next.js la lea
  console.log('Setting cookie with token:', access_token);
  document.cookie = `usuario_token=${access_token}; path=/; max-age=86400; secure; samesite=strict`;
},
      updateUser: (partial) => set((state) => ({
        user: state.user ? { ...state.user, ...partial } : null,
      })),
      logout: () => {
        // Invalidar el token en el servidor con fetch nativo (evita circular dependency con axios)
        const token = useAuthStore.getState().access_token;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/huellitas';
        if (token) {
          fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { /* si falla igual limpiamos local */ });
        }
        set({ user: null, access_token: null });
        document.cookie = "usuario_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "usuario_rol=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      },
    }),
    { name: 'huellitas-auth' }
  )
);