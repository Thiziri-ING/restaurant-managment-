import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Search, ShoppingBag } from 'lucide-react';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { useTables } from '@/hooks/useTables';
import { usePosStore } from '@/stores/pos.store';
import { getMenuImage } from '@/data/menuImages';
import type { RestaurantTable } from '@/types';

// ─── Formatage prix ─────────────────────────────────────────────────────────
function formatDA(value: number): string {
  return `${Math.round(value).toLocaleString('fr-DZ')} DA`;
}

// ─── Composant principal ─────────────────────────────────────────────────────
export function MenuGrid() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch]         = useState('');
  const [, setSearchParams]         = useSearchParams();

  const { data: categories }            = useMenuCategories();
  const { data: items, isLoading }      = useMenuItems({
    categoryId,
    available: true,
    search: search.trim() || undefined,
  });
  const { data: allTables }             = useTables();
  const addItem                         = usePosStore((s) => s.addItem);
  const { setSelectedTable }            = usePosStore();

  const freeTables = allTables?.filter((t) => t.status === 'FREE') ?? [];

  const handleSelectFreeTable = (table: RestaurantTable) => {
    setSelectedTable(table.id);
    setSearchParams({ view: 'menu', type: 'DINE_IN' });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">

      {/* ── Barre du haut : recherche + bouton emporter ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-[14px] font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <button
          type="button"
          onClick={() => setSearchParams({ view: 'menu', type: 'TAKEAWAY' })}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ShoppingBag size={16} className="text-slate-500" />
          Commande à emporter
        </button>
      </div>

      {/* ── Tabs de catégories ── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setCategoryId(undefined)}
          className={clsx(
            'shrink-0 rounded-xl border px-5 py-2 text-[14px] font-semibold transition-all',
            !categoryId
              ? 'border-blue-500 bg-[#edf2fa] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          Tous
        </button>
        {categories?.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={clsx(
              'shrink-0 rounded-xl border px-5 py-2 text-[14px] font-semibold transition-all',
              categoryId === cat.id
                ? 'border-blue-500 bg-[#edf2fa] text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Grille des plats ── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-400">
          Chargement du menu...
        </div>
      ) : items?.data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-medium text-slate-400">
          Aucun produit trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 overflow-y-auto pr-0.5 pb-4">
          {items?.data.map((item) => {
            const imgSrc = getMenuImage(item.name, item.category.name, item.imageUrl);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => addItem({ id: item.id, name: item.name, price: item.price })}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                    }}
                  />
                </div>

                {/* Infos */}
                <div className="flex flex-col gap-1 p-3 items-center">
                  <span className="text-[14px] font-bold leading-snug text-slate-900 line-clamp-1">
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-[12px] text-slate-600 line-clamp-2 leading-snug">
                      {item.description}
                    </span>
                  )}
                  <span className="mt-1 text-[13px] font-black text-blue-500">
                    {formatDA(item.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tables libres ── */}
      {freeTables.length > 0 && (
        <div className="mt-auto pt-2 shrink-0 border-t border-slate-100">
          <p className="mb-3 text-[13px] font-black uppercase tracking-wide text-slate-900">
            TABLES LIBRES — CLIQUEZ POUR COMMANDER
          </p>
          <div className="flex flex-wrap gap-2 pb-2">
            {freeTables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => handleSelectFreeTable(table)}
                className="rounded-lg border border-green-300 bg-green-50/70 px-3 py-1.5 text-[13px] font-bold text-slate-900 transition hover:bg-green-100 hover:shadow-sm"
              >
                {table.name}{' '}
                <span className="font-medium text-slate-800">({table.zone.name})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
