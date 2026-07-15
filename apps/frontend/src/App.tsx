import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { PosPage } from '@/pages/pos/PosPage';
import { StockPage } from '@/pages/stock/StockPage';
import { MenuPage } from '@/pages/menu/MenuPage';
import { TablesPage } from '@/pages/tables/TablesPage';
import { ReservationsPage } from '@/pages/reservations/ReservationsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { CashRegisterPage } from '@/pages/cash/CashRegisterPage';
import { CaissierPageRoute } from '@/pages/caissier/CaissierPageRoute';
import { ManagerPageRoute } from '@/pages/manager-app/ManagerPageRoute';
import { MagasinierPageRoute } from '@/pages/magasinier-app/MagasinierPageRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/stores/auth.store';

function RoleHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.roles.includes('MANAGER')) return <Navigate to="/manager" replace />;
  if (user?.roles.includes('CAISSIER')) return <Navigate to="/caisse" replace />;
  if (user?.roles.includes('MAGASINIER')) return <Navigate to="/stock-manager" replace />;
  return <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Interface Caissier — plein écran, avec sa propre barre latérale */}
      <Route
        path="/caisse"
        element={
          <ProtectedRoute roles={['MANAGER', 'CAISSIER']}>
            <CaissierPageRoute />
          </ProtectedRoute>
        }
      />

      {/* Interface Manager — plein écran, avec sa propre barre latérale */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={['MANAGER']}>
            <ManagerPageRoute />
          </ProtectedRoute>
        }
      />

      {/* Interface Magasinier — plein écran, avec sa propre barre latérale */}
      <Route
        path="/stock-manager"
        element={
          <ProtectedRoute roles={['MANAGER', 'MAGASINIER']}>
            <MagasinierPageRoute />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Anciennes pages manager (conservées, non liées dans le menu) */}
        <Route path="/dashboard"    element={<ProtectedRoute roles={['MANAGER']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/reports"      element={<ProtectedRoute roles={['MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute roles={['MANAGER']}><AdminPage /></ProtectedRoute>} />
        <Route path="/menu"         element={<ProtectedRoute roles={['MANAGER']}><MenuPage /></ProtectedRoute>} />

        {/* Anciennes pages caissier (conservées, non liées dans le menu) */}
        <Route path="/pos"          element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><PosPage /></ProtectedRoute>} />
        <Route path="/tables"       element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><TablesPage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><ReservationsPage /></ProtectedRoute>} />
        <Route path="/cash"         element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><CashRegisterPage /></ProtectedRoute>} />

        {/* Ancienne page magasinier (conservée, non liée dans le menu) */}
        <Route path="/stock"        element={<ProtectedRoute roles={['MANAGER', 'MAGASINIER']}><StockPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
}
