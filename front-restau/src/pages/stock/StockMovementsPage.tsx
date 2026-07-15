import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { useStockEntries, useStockOutputs } from '@/hooks/useStock';
import { Card } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StockEntryFormModal } from '@/components/stock/StockEntryFormModal';
import { StockOutputFormModal } from '@/components/stock/StockOutputFormModal';

export function StockMovementsPage() {
  const [tab, setTab] = useState<'entries' | 'outputs'>('entries');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showOutputForm, setShowOutputForm] = useState(false);

  const { data: entries, isLoading: loadingEntries } = useStockEntries();
  const { data: outputs, isLoading: loadingOutputs } = useStockOutputs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mouvements de stock</h1>
          <p className="text-sm text-slate-500">Entrées et sorties de produits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="success" icon={<ArrowDownCircle size={16} />} onClick={() => setShowEntryForm(true)}>
            Nouvelle entrée
          </Button>
          <Button variant="danger" icon={<ArrowUpCircle size={16} />} onClick={() => setShowOutputForm(true)}>
            Nouvelle sortie
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('entries')}
          className={tab === 'entries' ? 'border-b-2 border-primary-600 px-3 pb-2 text-sm font-medium text-primary-600' : 'px-3 pb-2 text-sm font-medium text-slate-500'}
        >
          Entrées ({entries?.meta.total ?? 0})
        </button>
        <button
          onClick={() => setTab('outputs')}
          className={tab === 'outputs' ? 'border-b-2 border-primary-600 px-3 pb-2 text-sm font-medium text-primary-600' : 'px-3 pb-2 text-sm font-medium text-slate-500'}
        >
          Sorties ({outputs?.meta.total ?? 0})
        </button>
      </div>

      {tab === 'entries' ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Produits</th>
                <th className="px-4 py-3">Valeur totale</th>
              </tr>
            </thead>
            <tbody>
              {loadingEntries ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : (
                entries?.data.map((entry) => {
                  const total = entry.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
                  return (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{entry.reference}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.supplier.name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(entry.entryDate).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.items.length} produit(s)</td>
                      <td className="px-4 py-3 font-medium text-emerald-600">+{total.toFixed(2)} DA</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Produits</th>
              </tr>
            </thead>
            <tbody>
              {loadingOutputs ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : (
                outputs?.data.map((output) => (
                  <tr key={output.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{output.reason}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(output.outputDate).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {output.items.map((i) => `${i.product.name} (${i.quantity} ${i.product.unit})`).join(', ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <StockEntryFormModal isOpen={showEntryForm} onClose={() => setShowEntryForm(false)} />
      <StockOutputFormModal isOpen={showOutputForm} onClose={() => setShowOutputForm(false)} />
    </div>
  );
}
