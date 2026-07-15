import { useMemo } from 'react';
import dayjs from 'dayjs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, PackageX, TrendingUp } from 'lucide-react';
import { useDashboard, useSalesTimeline, useTopItems } from '@/hooks/useReports';
import { KpiCard, Card } from '@/components/ui/Badge';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value) + ' DA';
}

export function DashboardPage() {
  const { data: kpis, isLoading } = useDashboard();

  const from = useMemo(() => dayjs().subtract(13, 'day').format('YYYY-MM-DD'), []);
  const to = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const { data: timeline } = useSalesTimeline(from, to, 'day');
  const { data: topItems } = useTopItems(5);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de l'activité du restaurant</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventes du jour" value={formatCurrency(kpis?.todaySales ?? 0)} icon={<DollarSign size={22} />} color="primary" />
        <KpiCard title="Ventes du mois" value={formatCurrency(kpis?.monthSales ?? 0)} icon={<TrendingUp size={22} />} color="green" />
        <KpiCard title="Commandes du jour" value={kpis?.todayOrders ?? 0} icon={<ShoppingBag size={22} />} color="amber" />
        <KpiCard
          title="Alertes stock"
          value={`${kpis?.outOfStockCount ?? 0} rupture(s) · ${kpis?.lowStockCount ?? 0} faible(s)`}
          icon={<PackageX size={22} />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Évolution des ventes (14 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeline ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">Top 5 plats vendus</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topItems ?? []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="totalQuantity" fill="#ea580c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {(kpis?.outOfStockCount ?? 0) > 0 && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50">
          <AlertTriangle className="text-red-500" size={20} />
          <p className="text-sm text-red-700">
            <strong>{kpis?.outOfStockCount}</strong> produit(s) en rupture de stock nécessitent votre attention.
          </p>
        </Card>
      )}
    </div>
  );
}
