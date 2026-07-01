import { useState } from 'react';
import clsx from 'clsx';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { usePosStore } from '@/stores/pos.store';

export function MenuGrid() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { data: categories } = useMenuCategories();
  const { data: items, isLoading } = useMenuItems({ categoryId, available: true });
  const addItem = usePosStore((s) => s.addItem);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryId(undefined)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
            !categoryId ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          Tous
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={clsx(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
              categoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Chargement du menu...</div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {items?.data.map((item) => (
            <button
              key={item.id}
              onClick={() => addItem({ id: item.id, name: item.name, price: item.price })}
              className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-transform hover:scale-[1.02] hover:border-primary-300"
            >
              <span className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</span>
              <span className="text-xs text-slate-400">{item.category.name}</span>
              <span className="mt-1 text-sm font-bold text-primary-600">{item.price.toFixed(2)} DA</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
