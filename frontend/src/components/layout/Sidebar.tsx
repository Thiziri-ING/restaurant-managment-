import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, UtensilsCrossed,
  Armchair, CalendarClock, BarChart3, Settings, LogOut,
  DollarSign,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';

const navItems = [
  { to: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard, roles: ['MANAGER'] },
  { to: '/pos',          label: 'Caisse POS',       icon: ShoppingCart,    roles: ['MANAGER', 'CAISSIER'] },
  { to: '/tables',       label: 'Tables',            icon: Armchair,        roles: ['MANAGER', 'CAISSIER'] },
  { to: '/reservations', label: 'Réservations',      icon: CalendarClock,   roles: ['MANAGER', 'CAISSIER'] },
  { to: '/cash',         label: 'Caisse',             icon: DollarSign,      roles: ['MANAGER', 'CAISSIER'] },
  { to: '/stock',        label: 'Stock',              icon: Package,         roles: ['MANAGER', 'MAGASINIER'] },
  { to: '/menu',         label: 'Menu',               icon: UtensilsCrossed, roles: ['MANAGER'] },
  { to: '/reports',      label: 'Rapports',           icon: BarChart3,       roles: ['MANAGER'] },
  { to: '/admin',        label: 'Administration',     icon: Settings,        roles: ['MANAGER'] },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const visibleItems = navItems.filter((item) =>
    item.roles.some((r) => user?.roles.includes(r)),
  );

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
          RM
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Restaurant</p>
          <p className="text-xs text-slate-400">Manager</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {navItems
          .filter((item) => item.roles.some((r) => user?.roles.includes(r)))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user?.roles.join(' · ')}</p>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
