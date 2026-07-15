import { useState } from 'react';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTables, useZones, useDeleteTable } from '@/hooks/useTables';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export function TablesOptionsPage() {
  const { data: tables, isLoading: isLoadingTables } = useTables();
  const { data: zones } = useZones();
  const deleteTable = useDeleteTable();
  const [showNewTable, setShowNewTable] = useState(false);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Options Tables</h1>
            <p className="text-sm font-medium text-slate-500">
              Gérez les tables (ajout et suppression uniquement).
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewTable(true)} icon={<Plus size={18} />}>
          Ajouter une Table
        </Button>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Nom</th>
                <th className="px-6 py-4 font-bold">Capacité</th>
                <th className="px-6 py-4 font-bold">Zone</th>
                <th className="px-6 py-4 font-bold">Statut</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingTables ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Chargement...
                  </td>
                </tr>
              ) : tables?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Aucune table trouvée.
                  </td>
                </tr>
              ) : (
                tables?.map((table) => (
                  <tr key={table.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{table.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{table.capacity} pers.</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{table.zone?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        table.status === 'FREE' ? 'bg-green-100 text-green-700' :
                        table.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer la table ${table.name} ?`)) {
                            deleteTable.mutate(table.id);
                          }
                        }}
                        icon={<Trash2 size={16} />}
                        loading={deleteTable.isPending}
                        className="py-1.5 px-3 text-xs"
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewTableModal
        isOpen={showNewTable}
        onClose={() => setShowNewTable(false)}
        zones={zones ?? []}
      />
    </div>
  );
}

function NewTableModal({ isOpen, onClose, zones }: { isOpen: boolean; onClose: () => void; zones: any[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zoneId, setZoneId] = useState('');

  const create = useMutation({
    mutationFn: async () => apiClient.post('/tables', { name, capacity: Number(capacity), zoneId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table créée avec succès');
      onClose();
      setName('');
      setCapacity('4');
      setZoneId('');
    },
    onError: () => toast.error('Erreur lors de la création de la table'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une table" size="sm">
      <div className="flex flex-col gap-4">
        <Input label="Nom de la table" placeholder="Ex: T15" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Capacité (couverts)" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <Select label="Zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="">Sélectionner une zone...</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </Select>
        <div className="pt-2">
          <Button onClick={() => create.mutate()} loading={create.isPending} className="w-full" disabled={!name || !zoneId}>
            Créer la table
          </Button>
        </div>
      </div>
    </Modal>
  );
}
