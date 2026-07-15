import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart3, Settings, LogOut,
  Clock, ChevronLeft, ChevronRight, Utensils, LayoutGrid,
  Map, ShoppingBag, CalendarDays, BookOpen
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  // État de réduction persisté dans le localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Initiales de l'utilisateur
  const initials = user?.fullName
    ? user.fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    : 'CA';

  // Éléments de navigation calqués sur l'image + conservation des routes Manager
  const categories = [
    {
      title: 'CAISSE',
      items: [
        {
          to: '/tables',
          label: 'Plan de Salle',
          icon: Map,
          roles: ['MANAGER', 'CAISSIER'],
        },

        {
          to: '/carte',
          label: 'Menu',
          icon: BookOpen,
          roles: ['MANAGER', 'CAISSIER'],
        },
        {
          to: '/takeaway',
          label: 'À Emporter',
          icon: ShoppingBag,
          roles: ['MANAGER', 'CAISSIER'],
        },
        {
          to: '/reservations',
          label: 'Réservations',
          icon: CalendarDays,
          roles: ['MANAGER', 'CAISSIER'],
        },
        {
          to: '/cash',
          label: 'Historique',
          icon: Clock,
          roles: ['MANAGER', 'CAISSIER'],
        },
      ],
    },
    {
      title: 'GESTION',
      items: [
        {
          to: '/tables-options',
          label: 'Options Tables',
          icon: LayoutGrid,
          roles: ['MANAGER', 'CAISSIER'],
        },
        // Liens invisibles pour le caissier, visibles uniquement pour le manager
        {
          to: '/dashboard',
          label: 'Tableau de bord',
          icon: LayoutDashboard,
          roles: ['MANAGER'],
        },
        {
          to: '/stock',
          label: 'Stock',
          icon: Package,
          roles: ['MANAGER', 'MAGASINIER'],
        },
        {
          to: '/menu',
          label: 'Gestion du Menu',
          icon: Utensils, // Réutilisation de l'icône
          roles: ['MANAGER'],
        },
        {
          to: '/reports',
          label: 'Rapports',
          icon: BarChart3,
          roles: ['MANAGER'],
        },
        {
          to: '/admin',
          label: 'Administration',
          icon: Settings,
          roles: ['MANAGER'],
        },
      ],
    },
  ];

  // Vérifie si la route est active
  const checkActive = (itemTo: string) => {
    const currentPath = location.pathname;
    return currentPath === itemTo || currentPath.startsWith(itemTo + '/');
  };

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0',
        isCollapsed ? 'w-[76px]' : 'w-[240px]',
      )}
      style={{ backgroundColor: '#eef2f6' }}
    >
      {/* ─── Brand ─── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm">
          <Utensils size={18} strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <span className="text-[16px] font-black tracking-tight text-slate-900 whitespace-nowrap">
            RestauManager
          </span>
        )}
      </div>

      {/* ─── User Info ─── */}
      <div className="flex items-center gap-3 px-5 py-4 overflow-hidden mb-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
          {initials}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-[14px] font-bold text-slate-900 truncate">
              {user?.fullName ?? 'Caissier'}
            </p>
            <p className="text-[12px] font-medium text-slate-500">
              Poste 1
            </p>
          </div>
        )}
      </div>

      {/* ─── Navigation Categories ─── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {categories.map((category) => {
          const allowedItems = category.items.filter((item) =>
            item.roles.some((r) => user?.roles.includes(r)),
          );
          if (allowedItems.length === 0) return null;

          return (
            <div key={category.title}>
              {!isCollapsed && (
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-800">
                  {category.title}
                </p>
              )}

              <div className="space-y-1">
                {allowedItems.map((item) => {
                  const isActive = checkActive(item.to);

                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => navigate(item.to)}
                      title={isCollapsed ? item.label : undefined}
                      className={clsx(
                        'flex w-full items-center rounded-xl text-[14px] font-semibold transition-all duration-200',
                        isCollapsed
                          ? 'justify-center p-3'
                          : 'gap-3 px-4 py-[10px]',
                        isActive
                          ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-700 hover:bg-slate-200/50 hover:text-slate-900',
                      )}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ─── Footer ─── */}
      <div className="px-3 pb-4 space-y-1">
        {/* Logout */}
        <button
          type="button"
          onClick={() => logout.mutate()}
          title={isCollapsed ? 'Déconnexion' : undefined}
          className={clsx(
            'flex w-full items-center rounded-xl text-[14px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200/50',
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-[10px]',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapse}
          className={clsx(
            'flex w-full items-center rounded-xl text-[14px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200/50',
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-[10px]',
          )}
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}