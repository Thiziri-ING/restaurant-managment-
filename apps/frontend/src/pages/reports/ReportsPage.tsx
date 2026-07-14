import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, KpiCard } from '@/components/ui/Badge';
import { TrendingUp, ShoppingBag, Percent, Package } from 'lucide-react';
import clsx from 'clsx';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function formatDA(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' DA';
}

function useSalesReport(from: string, to: string) {
  return useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/sales', { params: { from, to } });
      return data;
    },
    enabled: !!from && !!to,
  });
}

function useSalesTimeline(from: string, to: string, granularity: 'day' | 'month') {
  return useQuery({
    queryKey: ['report-timeline', from, to, granularity],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/sales/timeline', { params: { from, to, granularity } });
      return data as Array<{ period: string; revenue: number; orderCount: number }>;
    },
    enabled: !!from && !!to,
  });
}

function useTopItems(from: string, to: string) {
  return useQuery({
    queryKey: ['report-top', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/top-items', { params: { from, to, limit: 8 } });
      return data as Array<{ name: string; totalQuantity: number; totalRevenue: number }>;
    },
    enabled: !!from && !!to,
  });
}

function useStockState() {
  return useQuery({
    queryKey: ['report-stock-state'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/stock-state');
      return data;
    },
  });
}

type Period = '7d' | '30d' | '90d' | '365d' | 'custom';

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [activeTab, setActiveTab] = useState<'sales' | 'stock'>('sales');

  const { from, to } = useMemo(() => {
    if (period === 'custom') return { from: customFrom, to: customTo };
    const days = parseInt(period);
    return { from: dayjs().subtract(days, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') };
  }, [period, customFrom, customTo]);

  const granularity: 'day' | 'month' = period === '365d' ? 'month' : 'day';

  const { data: salesReport } = useSalesReport(from, to);
  const { data: timeline } = useSalesTimeline(from, to, granularity);
  const { data: topItems } = useTopItems(from, to);
  const { data: stockState } = useStockState();

  const pieData = Object.entries(salesReport?.byPaymentMethod ?? {}).map(([method, amount]) => ({
    name: method === 'CASH' ? 'Espèces' : method === 'CARD' ? 'Carte' : method,
    value: amount as number,
  }));

  const categoryStockData = Object.entries(stockState?.valueByCategory ?? {}).map(([name, value]) => ({
    name,
    value: Math.round(value as number),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
          <p className="text-sm text-slate-500">Analyse des ventes et de l'inventaire</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {(['7d', '30d', '90d', '365d', 'custom'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              period === p ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {p === 'custom' ? 'Personnalisé' : p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '90d' ? '90 jours' : '1 an'}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
            <span className="text-slate-400">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['sales', 'stock'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx('pb-2 px-3 text-sm font-medium', activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500')}
          >
            {tab === 'sales' ? 'Ventes & CA' : 'Stock'}
          </button>
        ))}
      </div>

      {activeTab === 'sales' ? (
        <div className="flex flex-col gap-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard title="Chiffre d'affaires" value={formatDA(salesReport?.totalRevenue ?? 0)} icon={<TrendingUp size={22} />} color="primary" />
            <KpiCard title="Commandes" value={salesReport?.totalOrders ?? 0} icon={<ShoppingBag size={22} />} color="green" />
            <KpiCard title="Panier moyen" value={formatDA(salesReport?.averageOrderValue ?? 0)} icon={<Percent size={22} />} color="amber" />
            <KpiCard title="Total remises" value={formatDA(0)} icon={<Percent size={22} />} color="red" />
          </div>

          {/* Timeline chart */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Évolution du chiffre d'affaires</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatDA(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="CA (DA)" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top items */}
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Articles les plus vendus</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topItems ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="totalQuantity" name="Qté vendue" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Payment methods pie */}
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Répartition par moyen de paiement</h2>
              {pieData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-slate-400">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatDA(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Top items table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Détail — Top articles</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3 text-right">Quantité vendue</th>
                  <th className="px-4 py-3 text-right">CA généré</th>
                </tr>
              </thead>
              <tbody>
                {(topItems ?? []).map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.totalQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary-600">{formatDA(item.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stock KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard title="Valeur totale stock" value={formatDA(stockState?.totalValue ?? 0)} icon={<Package size={22} />} color="primary" />
            <KpiCard title="Produits actifs" value={stockState?.totalProducts ?? 0} icon={<Package size={22} />} color="green" />
            <KpiCard title="Ruptures de stock" value={stockState?.outOfStockCount ?? 0} icon={<Package size={22} />} color="red" />
            <KpiCard title="Stock faible" value={stockState?.lowStockCount ?? 0} icon={<Package size={22} />} color="amber" />
          </div>

          {/* Stock by category pie */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Valeur du stock par catégorie</h2>
              {categoryStockData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-slate-400">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryStockData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name} labelLine>
                      {categoryStockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatDA(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Out of stock list */}
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-800">Produits en rupture de stock</h2>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {(stockState?.outOfStock ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucun produit en rupture 🎉</p>
                ) : (
                  stockState?.outOfStock.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-red-800">{p.name}</p>
                        <p className="text-xs text-red-500">{p.code} · {p.categoryName}</p>
                      </div>
                      <span className="text-xs font-bold text-red-700">0 {p.unit}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
