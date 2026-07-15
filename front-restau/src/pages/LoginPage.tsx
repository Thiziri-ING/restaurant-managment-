import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { loginSchema, LoginFormValues } from '@/schemas';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const getDefaultRoute = (roles: string[] = []) => {
    if (roles.includes('CAISSIER')) return '/pos';
    if (roles.includes('MAGASINIER')) return '/stock';
    return '/dashboard';
  };

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isAuthenticated && user) navigate(getDefaultRoute(user.roles));
  }, [isAuthenticated, navigate, user]);

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: (data) => navigate(getDefaultRoute(data.user.roles)),
    });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
            <UtensilsCrossed size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">RestauManager</h1>
          <p className="text-sm text-slate-500">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="manager@restaurant.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" loading={login.isPending} className="mt-2 w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
