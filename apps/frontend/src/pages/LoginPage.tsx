import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { loginSchema, LoginFormValues } from '@/schemas';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
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

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, { onSuccess: () => navigate('/') });
  };

  return (
    <div className="rm-app min-h-screen w-full flex items-center justify-center bg-bg font-sans p-6">
      <div className="w-full max-w-sm rounded-r3 border border-border bg-surface p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-r2 text-white shadow-glow"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue2))' }}
          >
            <UtensilsCrossed size={26} />
          </div>
          <h1 className="text-[1.35rem] font-black text-black">Restaurant Manager</h1>
          <p className="text-[0.92rem] font-semibold text-black/60">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-bold text-black">Email</label>
            <input
              type="email"
              placeholder="manager@restaurant.com"
              className="w-full rounded-r2 border border-border bg-surface2 px-4 py-2.5 text-[0.95rem] font-semibold text-black outline-none transition focus:border-blue focus:bg-surface focus:shadow-glow"
              {...register('email')}
            />
            {errors.email?.message && (
              <span className="text-[0.8rem] font-semibold text-red">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-bold text-black">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-r2 border border-border bg-surface2 px-4 py-2.5 text-[0.95rem] font-semibold text-black outline-none transition focus:border-blue focus:bg-surface focus:shadow-glow"
              {...register('password')}
            />
            {errors.password?.message && (
              <span className="text-[0.8rem] font-semibold text-red">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="t-std mt-2 w-full rounded-r2 py-3 text-[0.95rem] font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue2))' }}
          >
            {login.isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
