import clsx from 'clsx';
import { Users } from 'lucide-react';
import { useTables, useZones } from '@/hooks/useTables';
import type { RestaurantTable } from '@/types';
import { useState } from 'react';

const statusColors = {
  FREE: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  OCCUPIED: 'bg-red-100 border-red-300 text-red-700',
  RESERVED: 'bg-amber-100 border-amber-300 text-amber-700',
};

const statusLabels = { FREE: 'Libre', OCCUPIED: 'Occupée', RESERVED: 'Réservée' };

export function TableSelector({
  selectedTableId,
  onSelect,
}: {
  selectedTableId: string | null;
  onSelect: (table: RestaurantTable) => void;
}) {
  const [zoneId, setZoneId] = useState<string | undefined>(undefined);
  const { data: zones } = useZones();
  const { data: tables, isLoading } = useTables(zoneId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setZoneId(undefined)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
            !zoneId ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          Toutes les zones
        </button>
        {zones?.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setZoneId(zone.id)}
            className={clsx(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
              zoneId === zone.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Chargement des tables...</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {tables?.map((table) => (
            <button
              key={table.id}
              onClick={() => onSelect(table)}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-semibold transition-transform hover:scale-[1.03]',
                statusColors[table.status],
                selectedTableId === table.id && 'ring-2 ring-primary-500 ring-offset-1',
              )}
            >
              <span>{table.name}</span>
              <span className="flex items-center gap-1 text-xs font-normal opacity-75">
                <Users size={12} /> {table.capacity}
              </span>
              <span className="text-[10px] font-normal uppercase opacity-60">{statusLabels[table.status]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
