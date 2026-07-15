import { useState } from 'react';
import { Plus, Search, AlertTriangle, PackageX } from 'lucide-react';
import { useProducts, useStockCategories, useProductAlerts } from '@/hooks/useStock';
import { Card, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ProductFormModal } from '@/components/stock/ProductFormModal';

export function StockProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: categories } = useStockCategories();
  const { data: products, isLoading } = useProducts({ search: search || undefined, categoryId: categoryId || undefined });
  const { data: alerts } = useProductAlerts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produits de stock</h1>
          <p className="text-sm text-slate-500">Gérez votre catalogue de produits</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setEditingProduct(null); setShowForm(true); }}>
          Nouveau produit
        </Button>
      </div>

      {(alerts?.length ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <p className="text-sm font-medium">{alerts?.length} produit(s) nécessitent votre attention (stock faible ou rupture)</p>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
          <option value="">Toutes les catégories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Stock actuel</th>
              <th className="px-4 py-3">Seuil alerte</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : (
              products?.data.map((p) => {
                const isOut = p.currentQty <= 0;
                const isLow = !isOut && p.currentQty <= p.alertQty;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.code}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category.name}</td>
                    <td className="px-4 py-3">{p.currentQty} {p.unit}</td>
                    <td className="px-4 py-3 text-slate-400">{p.alertQty} {p.unit}</td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <Badge color="red"><PackageX size={12} className="mr-1 inline" />Rupture</Badge>
                      ) : isLow ? (
                        <Badge color="amber">Stock faible</Badge>
                      ) : (
                        <Badge color="green">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditingProduct(p); setShowForm(true); }}
                        className="text-xs font-medium text-primary-600 hover:underline"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <ProductFormModal isOpen={showForm} onClose={() => setShowForm(false)} product={editingProduct} categories={categories ?? []} />
    </div>
  );
}
