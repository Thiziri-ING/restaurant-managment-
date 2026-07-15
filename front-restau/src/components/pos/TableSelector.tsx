import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ListFilter, Search, Users } from 'lucide-react';
import { useTables, useZones } from '@/hooks/useTables';
import type { RestaurantTable, TableStatus } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const statusLabels: Record<TableStatus, string> = {
  FREE: 'Libre',
  OCCUPIED: 'Occupée',
  RESERVED: 'Réservée',
};

// Card border colors matching the screenshot
const cardBorderColor: Record<TableStatus, string> = {
  FREE: 'border-emerald-400',
  OCCUPIED: 'border-blue-400',
  RESERVED: 'border-red-300',
};

// Card background colors
const cardBgColor: Record<TableStatus, string> = {
  FREE: 'bg-white',
  OCCUPIED: 'bg-white',
  RESERVED: 'bg-red-50/60',
};

// Status dot colors
const dotColor: Record<TableStatus, string> = {
  FREE: 'bg-emerald-500',
  OCCUPIED: 'bg-blue-500',
  RESERVED: 'bg-red-500',
};

// Status text colors
const statusTextColor: Record<TableStatus, string> = {
  FREE: 'text-emerald-600',
  OCCUPIED: 'text-blue-600',
  RESERVED: 'text-red-500',
};

function formatDA(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v ?? 0));
}

export function TableSelector({
  selectedTableId,
  onSelect,
}: {
  selectedTableId: string | null;
  onSelect: (table: RestaurantTable) => void;
}) {
  const [zoneId, setZoneId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<TableStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const { data: zones } = useZones();
  const { data: tables, isLoading } = useTables(zoneId);

  const filteredTables = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (tables ?? []).filter((table) => {
      if (status !== 'ALL' && table.status !== status) return false;
      if (!normalizedSearch) return true;

      return (
        table.name.toLowerCase().includes(normalizedSearch) ||
        table.zone.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, status, tables]);

  // Get total amount for a table's active orders
  const getTableTotal = (table: RestaurantTable) => {
    if (!table.orders || table.orders.length === 0) return 0;
    return table.orders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce((itemSum, item) => {
          return itemSum + item.unitPrice * item.quantity - item.discount;
        }, 0)
      );
    }, 0);
  };

  // Get time elapsed since first active order
  const getTableTime = (table: RestaurantTable) => {
    if (!table.orders || table.orders.length === 0) return null;
    const earliest = table.orders.reduce((min, o) =>
      new Date(o.createdAt) < new Date(min.createdAt) ? o : min,
    );
    const diff = dayjs().diff(dayjs(earliest.createdAt), 'minute');
    return `${diff} min`;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* ─── Search + Zone tabs + Status filters ─── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche rapide d'une table (ex..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Zone tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setZoneId(undefined)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              !zoneId
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            Toutes
          </button>
          {zones?.map((zone) => (
            <button
              type="button"
              key={zone.id}
              onClick={() => setZoneId(zone.id)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                zoneId === zone.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {zone.name}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="flex h-8 items-center">
          <ListFilter size={16} className="text-slate-400" />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setStatus('ALL')}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              status === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            Tous
          </button>
          {(['FREE', 'OCCUPIED', 'RESERVED'] as TableStatus[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                status === s
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-5 text-sm font-medium">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-600">Occupée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-slate-600">Réservée</span>
        </div>
      </div>

      {/* ─── Table grid ─── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-medium text-slate-400">
          Chargement des tables...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-medium text-slate-400">
          Aucune table ne correspond à ces critères.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredTables.map((table) => {
            const total = getTableTotal(table);
            const timeElapsed = getTableTime(table);
            const hasOrder = table.orders && table.orders.length > 0 && total > 0;

            return (
              <button
                type="button"
                key={table.id}
                onClick={() => onSelect(table)}
                className={clsx(
                  'group relative flex min-h-[150px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                  cardBorderColor[table.status],
                  cardBgColor[table.status],
                  selectedTableId === table.id && 'ring-2 ring-blue-500 ring-offset-2',
                )}
              >
                {/* Table name */}
                <span className="text-2xl font-black leading-none text-slate-900">
                  {table.name}
                </span>

                {/* Capacity */}
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Users size={12} />
                  {table.capacity} pers.
                </span>

                {/* Status badge */}
                <span className="mt-1 inline-flex items-center gap-1.5">
                  <span
                    className={clsx('h-2 w-2 rounded-full', dotColor[table.status])}
                  />
                  <span
                    className={clsx(
                      'text-xs font-bold',
                      statusTextColor[table.status],
                    )}
                  >
                    {statusLabels[table.status]}
                  </span>
                </span>

                {/* Order info for occupied tables */}
                {hasOrder && (
                  <div className="mt-2 flex items-baseline gap-2 text-xs">
                    <span className="font-black text-blue-600">
                      {formatDA(total)}{' '}
                      <span className="font-bold text-blue-500">DA</span>
                    </span>
                    <span className="font-medium text-slate-400">
                      il y a
                    </span>
                    <span className="font-bold text-slate-500">
                      {timeElapsed}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
