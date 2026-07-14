import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginFormValues } from '@/schemas';
import toast from 'react-hot-toast';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data } = await apiClient.post('/auth/login', values);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Bienvenue ${data.user.fullName} !`);
    },
    onError: () => {
      toast.error('Email ou mot de passe incorrect');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout', { refreshToken });
    },
    onSettled: () => {
      logout();
    },
  });
}
