import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, Card } from '@/components/ui/Badge';
import { menuItemSchema, MenuItemFormValues } from '@/schemas';
import type { MenuItem } from '@/types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ── Hooks mutation locaux ─────────────────────────────────────
function useUpsertMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: MenuItemFormValues }) => {
      if (id) {
        const { data } = await apiClient.put(`/menu/items/${id}`, values);
        return data;
      }
      const { data } = await apiClient.post('/menu/items', values);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Plat enregistré');
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });
}

function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/menu/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Plat supprimé');
    },
  });
}

function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) =>
      apiClient.patch(`/menu/items/${id}/availability`, { available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

// ── Formulaire plat ───────────────────────────────────────────
function MenuItemFormModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}) {
  const { data: categories } = useMenuCategories();
  const upsert = useUpsertMenuItem();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: item
      ? { name: item.name, description: item.description ?? '', price: item.price, available: item.available, categoryId: item.categoryId }
      : { name: '', description: '', price: 0, available: true, categoryId: '' },
  });

  const onSubmit = (values: MenuItemFormValues) => {
    upsert.mutate({ id: item?.id, values }, { onSuccess: () => { reset(); onClose(); } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Modifier le plat' : 'Nouveau plat'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nom du plat *" error={errors.name?.message} {...register('name')} />
        <Input label="Description" {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prix (DA) *" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
          <Select label="Catégorie *" error={errors.categoryId?.message} {...register('categoryId')}>
            <option value="">Sélectionner...</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('available')} className="rounded" />
          <span>Disponible à la commande</span>
        </label>
        <Button type="submit" loading={upsert.isPending} className="mt-2 w-full">
          {item ? 'Mettre à jour' : 'Créer le plat'}
        </Button>
      </form>
    </Modal>
  );
}

// ── Page principale ───────────────────────────────────────────
export function MenuPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  const { data: categories } = useMenuCategories();
  const { data: items, isLoading } = useMenuItems({ search: search || undefined, categoryId: categoryId || undefined });
  const deleteItem = useDeleteMenuItem();
  const toggleAvailability = useToggleAvailability();

  const handleEdit = (item: MenuItem) => { setEditingItem(item); setShowForm(true); };
  const handleNew = () => { setEditingItem(null); setShowForm(true); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu</h1>
          <p className="text-sm text-slate-500">Gérez vos plats et catégories</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'items' && (
            <Button icon={<Plus size={16} />} onClick={handleNew}>Nouveau plat</Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(['items', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'pb-2 px-3 text-sm font-medium transition-colors',
              activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab === 'items' ? `Plats (${items?.meta.total ?? 0})` : `Catégories (${categories?.length ?? 0})`}
          </button>
        ))}
      </div>

      {activeTab === 'items' ? (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Rechercher un plat..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
              <option value="">Toutes les catégories</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-3 py-12 text-center text-slate-400">Chargement...</div>
            ) : items?.data.map((item) => (
              <Card key={item.id} className={clsx('flex flex-col gap-3', !item.available && 'opacity-60')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category.name}</p>
                  </div>
                  <span className="text-base font-bold text-primary-600">{Number(item.price).toFixed(2)} DA</span>
                </div>
                {item.description && <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between">
                  <Badge color={item.available ? 'green' : 'gray'}>
                    {item.available ? 'Disponible' : 'Indisponible'}
                  </Badge>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleAvailability.mutate({ id: item.id, available: !item.available })}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title={item.available ? 'Rendre indisponible' : 'Rendre disponible'}
                    >
                      {item.available ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Supprimer ce plat ?')) deleteItem.mutate(item.id); }}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <MenuCategoriesPanel categories={categories ?? []} />
      )}

      <MenuItemFormModal isOpen={showForm} onClose={() => setShowForm(false)} item={editingItem} />
    </div>
  );
}

// ── Panel catégories ──────────────────────────────────────────
function MenuCategoriesPanel({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');

  const create = useMutation({
    mutationFn: async (name: string) => apiClient.post('/menu/categories', { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu-categories'] }); setNewName(''); toast.success('Catégorie créée'); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/menu/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-categories'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input placeholder="Nom de la nouvelle catégorie..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
        <Button onClick={() => newName.trim() && create.mutate(newName.trim())} loading={create.isPending}>Ajouter</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Catégorie</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { if (window.confirm('Supprimer cette catégorie ?')) remove.mutate(c.id); }} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}