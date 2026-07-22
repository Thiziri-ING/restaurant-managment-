import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loginSchema, LoginFormValues } from '@/schemas';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="rm-app min-h-screen w-full font-sans">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left — atmosphere panel */}
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          <div className="relative flex h-full flex-col justify-center px-16 py-16">
            <div
              className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_12px_30px_-8px_rgba(37,99,235,0.7)]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <UtensilsCrossed size={30} className="text-white" strokeWidth={2.25} />
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
              Restaurant
              <br />
              Manager
            </h1>
            <div className="mt-5 h-1 w-14 rounded-full bg-blue-600" />

            <p className="mt-6 max-w-xs text-lg leading-snug text-white/80">
              Gérez votre restaurant en toute simplicité
            </p>
          </div>
        </div>

        {/* Right — auth panel */}
        <div className="flex items-center justify-center bg-neutral-50 px-6 py-12">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl shadow-neutral-200/60 sm:p-10">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_12px_30px_-8px_rgba(37,99,235,0.65)]"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                <UtensilsCrossed size={28} className="text-white" strokeWidth={2.25} />
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-900">Restaurant Manager</h2>
              <p className="text-[0.95rem] font-medium text-neutral-500">
                Connectez-vous à votre compte
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-800">Email</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="email"
                    placeholder="manager@restaurant.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-[0.95rem] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    {...register('email')}
                  />
                </div>
                {errors.email?.message && (
                  <span className="text-[0.8rem] font-semibold text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-800">Mot de passe</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-11 text-[0.95rem] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <span className="text-[0.8rem] font-semibold text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[0.95rem] font-bold text-white shadow-[0_10px_25px_-8px_rgba(37,99,235,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(37,99,235,0.7)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                {login.isPending ? 'Connexion…' : 'Se connecter'}
                {!login.isPending && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}