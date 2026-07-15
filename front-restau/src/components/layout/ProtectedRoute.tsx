import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const hasAccess = roles.some((r) => user?.roles.includes(r));
    // CORRECTION: Redirection vers "/" (la racine) au lieu de "/dashboard"
    // De cette façon, "HomeRedirect" (dans App.tsx) se chargera de l'envoyer au bon endroit (ex: /pos pour le CAISSIER)
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}