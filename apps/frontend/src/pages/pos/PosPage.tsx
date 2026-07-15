import { useState } from 'react';
import { TableSelector } from '@/components/pos/TableSelector';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { usePosStore } from '@/stores/pos.store';
import type { RestaurantTable } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function PosPage() {
  const { selectedTableId, setSelectedTable } = usePosStore();
  const [view, setView] = useState<'tables' | 'menu'>('tables');
  const [selectedTable, setSelectedTableObj] = useState<RestaurantTable | null>(null);

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table.id);
    setSelectedTableObj(table);
    setView('menu');
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caisse</h1>
          <p className="text-sm text-slate-500">
            {selectedTable ? (
              <>
                Table <strong>{selectedTable.name}</strong> · {selectedTable.zone.name}
              </>
            ) : (
              'Sélectionnez une table ou commencez une commande à emporter'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('tables')}
            className={view === 'tables' ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white' : 'rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600'}
          >
            Tables
          </button>
          <button
            onClick={() => setView('menu')}
            className={view === 'menu' ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white' : 'rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600'}
          >
            Menu
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3">
        <div className="overflow-y-auto lg:col-span-2">
          {view === 'tables' ? (
            <TableSelector selectedTableId={selectedTableId} onSelect={handleSelectTable} />
          ) : (
            <MenuGrid />
          )}
        </div>
        <div className="overflow-hidden">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
