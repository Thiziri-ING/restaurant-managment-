import { useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Truck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StockProductsPage } from './StockProductsPage';
import { StockMovementsPage } from './StockMovementsPage';
import { useSuppliers } from '@/hooks/useStock';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Badge';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Suppliers panel ───────────────────────────────────────────
function SuppliersPanel() {
  const qc = useQueryClient();
  const { data: suppliers, isLoading } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  const create = useMutation({
    mutationFn: async () => apiClient.post('/suppliers', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setForm({ name: '', phone: '', email: '', address: '' });
      setShowForm(false);
      toast.success('Fournisseur créé');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
          Nouveau fournisseur
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : (suppliers ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun fournisseur</td></tr>
            ) : (
              suppliers?.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.address ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { if (window.confirm('Supprimer ?')) remove.mutate(s.id); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau fournisseur" size="sm">
        <div className="flex flex-col gap-4">
          <Input label="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button className="w-full" loading={create.isPending} onClick={() => create.mutate()} disabled={!form.name}>
            Créer le fournisseur
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Main hub ──────────────────────────────────────────────────
const TABS = [
  { key: 'products', label: 'Produits', icon: <Plus size={14} /> },
  { key: 'movements', label: 'Mouvements', icon: <ArrowDownCircle size={14} /> },
  { key: 'suppliers', label: 'Fournisseurs', icon: <Truck size={14} /> },
] as const;

export function StockPage() {
  const [tab, setTab] = useState<'products' | 'movements' | 'suppliers'>('products');

  return (
    <div className="flex flex-col gap-4">
      {/* Top-level tab switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-1.5 pb-2.5 px-3 text-sm font-medium transition-colors',
              tab === key
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'products' && <StockProductsPage />}
      {tab === 'movements' && <StockMovementsPage />}
      {tab === 'suppliers' && <SuppliersPanel />}
    </div>
  );
}
