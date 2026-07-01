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
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

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
        <Route path="/dashboard"    element={<ProtectedRoute roles={['MANAGER']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/reports"      element={<ProtectedRoute roles={['MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute roles={['MANAGER']}><AdminPage /></ProtectedRoute>} />
        <Route path="/menu"         element={<ProtectedRoute roles={['MANAGER']}><MenuPage /></ProtectedRoute>} />

        {/* Caissier */}
        <Route path="/pos"          element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><PosPage /></ProtectedRoute>} />
        <Route path="/tables"       element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><TablesPage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><ReservationsPage /></ProtectedRoute>} />
        <Route path="/cash"         element={<ProtectedRoute roles={['MANAGER', 'CAISSIER']}><CashRegisterPage /></ProtectedRoute>} />

        {/* Magasinier */}
        <Route path="/stock"        element={<ProtectedRoute roles={['MANAGER', 'MAGASINIER']}><StockPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
