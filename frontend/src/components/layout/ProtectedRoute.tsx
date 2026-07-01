import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const hasAccess = roles.some((r) => user?.roles.includes(r));
    if (!hasAccess) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
