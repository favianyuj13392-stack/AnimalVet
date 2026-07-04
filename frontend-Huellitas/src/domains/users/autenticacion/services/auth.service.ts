import api from '@/shared/lib/axios';
import { LoginCredentials, LoginResponse } from "../login.types"

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<any>('/auth/login', credentials);
    return data;
  },

  verificarOtp: async (email: string, codigo: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/verificar-otp', { email, codigo });
    return data;
  },

  verificarPassword: async (password: string): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/auth/verificar-password', { password });
    return data;
  },
};