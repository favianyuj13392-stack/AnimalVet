import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { LoginCredentials } from '../login.types';
import { toast } from 'sonner';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [otpPendiente, setOtpPendiente] = useState<string | null>(null); // email si requiere OTP
  const router = useRouter();
  const queryClient = useQueryClient();

  const setLogin = useAuthStore((state) => state.setLogin);
  const logoutState = useAuthStore((state) => state.logout);

  const finalizarLogin = (response: any) => {
    queryClient.clear();
    setLogin(response.usuario, response.access_token);
    document.cookie = `usuario_token=${response.access_token}; path=/; max-age=86400;`;
    document.cookie = `usuario_rol=${response.usuario.rol.nombre}; path=/; max-age=86400;`;
    toast.success(`¡Bienvenido de vuelta, ${response.usuario.nombres}!`);
    switch (response.usuario.rol.id) {
      case 1: router.push('/admin/dashboard'); break;
      case 2: router.push('/vet/agenda');      break;
      case 3: router.push('/caja/pos');        break;
      case 4: router.push('/cliente/inicio');  break;
      default: router.push('/');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);

      if (response.requiere_otp) {
        setOtpPendiente(response.email);
        toast.info('Revisa tu correo — te enviamos un código de verificación.');
        return;
      }

      finalizarLogin(response);
    } catch (error: any) {
      console.error('Fallo en el Login:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificarOtp = async (codigo: string) => {
    if (!otpPendiente) return;
    setLoading(true);
    try {
      const response = await authService.verificarOtp(otpPendiente, codigo);
      setOtpPendiente(null);
      finalizarLogin(response);
    } catch (error: any) {
      console.error('Error OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    queryClient.clear();
    logoutState();
    toast.info('Has cerrado sesión correctamente.');
    router.push('/login');
  };

  return { login, verificarOtp, logout, loading, otpPendiente };
}