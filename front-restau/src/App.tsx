import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { PosPage } from '@/pages/pos/PosPage';
import { StockPage } from '@/pages/stock/StockPage';
import { MenuPage } from '@/pages/menu/MenuPage';
import { MenuClientPage } from '@/pages/menu/MenuClientPage';
import { TablesPage } from '@/pages/tables/TablesPage';
import { TablesOptionsPage } from '@/pages/tables/TablesOptionsPage';
import { ReservationsPage } from '@/pages/reservations/ReservationsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { CashRegisterPage } from '@/pages/cash/CashRegisterPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

function HomeRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 2. Redirection automatique du Caissier vers le Plan de salle (/tables) au lieu de /pos
  if (user?.roles.includes('CAISSIER')) return <Navigate to="/tables" replace />;
  if (user?.roles.includes('MAGASINIER')) return <Navigate to="/stock" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Manager */}
        {/* Manager & Caissier */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['MANAGER']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/tables-options" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><TablesOptionsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['MANAGER']}><AdminPage /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute roles={['MANAGER']}><MenuPage /></ProtectedRoute>} />

        {/* Caissier & Manager */}
        <Route path="/pos" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><PosPage /></ProtectedRoute>} />
        <Route path="/takeaway" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><MenuClientPage isTakeaway={true} /></ProtectedRoute>} />
        <Route path="/carte" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><MenuClientPage /></ProtectedRoute>} />
        <Route path="/tables" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><TablesPage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><ReservationsPage /></ProtectedRoute>} />
        <Route path="/cash" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><CashRegisterPage /></ProtectedRoute>} />
        {/* Magasinier */}
        <Route path="/stock" element={<ProtectedRoute roles={['MANAGER', 'MAGASINIER']}><StockPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}