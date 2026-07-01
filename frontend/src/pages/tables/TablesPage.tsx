import { useState } from 'react';
import { Plus, Users, ArrowRightLeft, GitMerge } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTables, useZones, useUpdateTableStatus, useMergeTables, useTransferOrder } from '@/hooks/useTables';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { RestaurantTable } from '@/types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<string, string> = { FREE: 'Libre', OCCUPIED: 'Occupée', RESERVED: 'Réservée' };
const STATUS_COLOR: Record<string, string> = {
  FREE: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  OCCUPIED: 'border-red-300 bg-red-50 text-red-800',
  RESERVED: 'border-amber-300 bg-amber-50 text-amber-800',
};

export function TablesPage() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [showNewTable, setShowNewTable] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const { data: zones } = useZones();
  const { data: tables, isLoading } = useTables(selectedZoneId);
  const updateStatus = useUpdateTableStatus();
  const mergeTables = useMergeTables();

  const toggleSelect = (id: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleMerge = () => {
    if (selectedTableIds.length < 2) return toast.error('Sélectionnez au moins 2 tables');
    mergeTables.mutate(selectedTableIds, {
      onSuccess: () => { setSelectedTableIds([]); setShowMerge(false); },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tables</h1>
          <p className="text-sm text-slate-500">Plan de salle et gestion des tables</p>
        </div>
        <div className="flex gap-2">
          {selectedTableIds.length >= 2 && (
            <Button variant="secondary" icon={<GitMerge size={16} />} onClick={() => setShowMerge(true)}>
              Fusionner ({selectedTableIds.length})
            </Button>
          )}
          <Button icon={<Plus size={16} />} onClick={() => setShowNewTable(true)}>
            Nouvelle table
          </Button>
        </div>
      </div>

      {/* Zone filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedZoneId(undefined)}
          className={clsx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium', !selectedZoneId ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600')}
        >
          Toutes les zones
        </button>
        {zones?.map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZoneId(z.id)}
            className={clsx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium', selectedZoneId === z.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600')}
          >
            {z.name}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        {Object.entries(STATUS_LABEL).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={clsx('h-3 w-3 rounded border', STATUS_COLOR[s])} />
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
        <span className="text-slate-400 ml-2">· Cliquer pour sélectionner · Double-clic pour changer le statut</span>
      </div>

      {/* Table grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {tables?.map((table) => (
            <button
              key={table.id}
              onClick={() => toggleSelect(table.id)}
              onDoubleClick={() => {
                const next = table.status === 'FREE' ? 'OCCUPIED' : 'FREE';
                updateStatus.mutate({ id: table.id, status: next });
              }}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-transform hover:scale-105 select-none',
                STATUS_COLOR[table.status],
                selectedTableIds.includes(table.id) && 'ring-2 ring-primary-500 ring-offset-2',
              )}
            >
              <span className="text-sm font-bold">{table.name}</span>
              <span className="flex items-center gap-0.5 text-xs opacity-70"><Users size={11} />{table.capacity}</span>
              {(table.orders?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-red-200 text-red-700 rounded-full px-1.5 py-0.5 font-medium">
                  {table.orders![0].items.length} plat(s)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Merge confirm modal */}
      <Modal isOpen={showMerge} onClose={() => setShowMerge(false)} title="Fusionner des tables" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Les commandes actives des tables sélectionnées seront regroupées sur la première table.
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTableIds.map((id) => {
              const t = tables?.find((x) => x.id === id);
              return <Badge key={id} color="blue">{t?.name ?? id}</Badge>;
            })}
          </div>
          <Button onClick={handleMerge} loading={mergeTables.isPending} className="w-full">
            Confirmer la fusion
          </Button>
        </div>
      </Modal>

      {/* New table modal */}
      <NewTableModal isOpen={showNewTable} onClose={() => setShowNewTable(false)} zones={zones ?? []} />
    </div>
  );
}

function NewTableModal({ isOpen, onClose, zones }: { isOpen: boolean; onClose: () => void; zones: Array<{ id: string; name: string }> }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zoneId, setZoneId] = useState('');

  const create = useMutation({
    mutationFn: async () => apiClient.post('/tables', { name, capacity: Number(capacity), zoneId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table créée');
      onClose();
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle table" size="sm">
      <div className="flex flex-col gap-4">
        <Input label="Nom de la table" placeholder="Ex: T-15" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Capacité (couverts)" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <Select label="Zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="">Sélectionner une zone...</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </Select>
        <Button onClick={() => create.mutate()} loading={create.isPending} className="w-full" disabled={!name || !zoneId}>
          Créer la table
        </Button>
      </div>
    </Modal>
  );
}
