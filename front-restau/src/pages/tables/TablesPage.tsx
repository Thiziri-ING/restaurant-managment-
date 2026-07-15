import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, ListFilter, 
  Pencil, ArrowLeftRight, Combine, 
  Plus, Trash2, MoreVertical
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTables, useZones, useUpdateTableStatus, useDeleteTable } from '@/hooks/useTables';
import { usePosStore } from '@/stores/pos.store';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ============================================================================
// UTILITAIRES
// ============================================================================
function getOrderTotal(order: any): number {
  if (!order?.items) return 0;
  const sub = order.items.reduce(
    (sum: number, item: any) =>
      sum + item.unitPrice * item.quantity * (1 - (item.discount ?? 0) / 100),
    0,
  );
  return sub * (1 - (order.discount ?? 0) / 100);
}

function minutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

// ============================================================================
// CONFIGURATION DES STYLES DE STATUTS
// ============================================================================
const STATUS_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  FREE:     { border: 'border-[#4ade80]', bg: 'bg-[#f0fdf4]',  text: 'text-[#16a34a]', dot: 'bg-[#22c55e]' },
  OCCUPIED: { border: 'border-[#4f86f7]', bg: 'bg-[#f0f5ff]',  text: 'text-[#4f86f7]', dot: 'bg-[#4f86f7]' },
  RESERVED: { border: 'border-[#f87171]', bg: 'bg-[#fef2f2]',  text: 'text-[#dc2626]', dot: 'bg-[#ef4444]' },
};

const STATUS_LABEL: Record<string, string> = { 
  FREE: 'Libre', 
  OCCUPIED: 'Occupée', 
  RESERVED: 'Réservée' 
};

// ============================================================================
// COMPOSANT PRINCIPAL : LA PAGE DES TABLES
// ============================================================================
export function TablesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setSelectedTable = usePosStore((s) => s.setSelectedTable);
  const [search, setSearch] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  
  const [showNewTable, setShowNewTable] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // NOUVEAU : État pour gérer le transfert de table
  const [transferSourceTable, setTransferSourceTable] = useState<any | null>(null);
  
  const [initialZoneId, setInitialZoneId] = useState('');

  const { data: zones } = useZones();
  const { data: tables, isLoading } = useTables(selectedZoneId);
  const updateStatus = useUpdateTableStatus();

  // NOUVEAU : Mutation pour transférer la commande
  const transferTable = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      // NOTE : Vérifiez que cette route '/tables/transfer' correspond bien à celle de votre Backend API.
      return apiClient.post('/tables/transfer', { sourceId, targetId }); 
    },
    onSuccess: (_, variables) => {
      const sourceName = transferSourceTable?.name;
      const targetName = tables?.find(t => t.id === variables.targetId)?.name;
      
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success(`Commande de ${sourceName} transférée vers ${targetName}`, {
        duration: 4000,
        style: { background: '#22c55e', color: '#fff', fontWeight: 'bold' } // Toast vert comme sur l'image
      });
      setTransferSourceTable(null); // Quitter le mode transfert
    },
    onError: () => toast.error('Erreur lors du transfert de la table'),
  });

  const filteredTables = tables?.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus ? t.status === selectedStatus : true;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.table-card')) {
        setSelectedTableId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6 h-full bg-[#f4f7f9] min-h-screen">
      
      {/* NOUVEAU : BANNIÈRE DE TRANSFERT (Visible uniquement si une table est en cours de transfert) */}
      {transferSourceTable && (
        <div className="flex items-center justify-between rounded-xl bg-[#eef4ff] px-5 py-3 text-[#4f86f7] font-semibold border border-[#d1e0ff] shadow-sm mb-1 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <ArrowLeftRight size={18} strokeWidth={2.5} />
            <span>Sélectionnez la table de destination pour le transfert depuis {transferSourceTable.name}</span>
          </div>
          <button
            onClick={() => setTransferSourceTable(null)}
            className="text-[14px] underline hover:text-blue-800 transition-colors cursor-pointer text-slate-700 font-bold"
          >
            Annuler
          </button>
        </div>
      )}

      {/* 1. BARRE DE FILTRES */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Recherche rapide d'une table (ex: T4)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:border-[#4f86f7] focus:outline-none focus:ring-1 focus:ring-[#4f86f7]"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setSelectedZoneId(undefined)}
            className={clsx('rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all', !selectedZoneId ? 'bg-[#eef4ff] border border-[#d1e0ff] text-slate-900' : 'border border-transparent text-slate-700 hover:bg-slate-50')}
          >
            Toutes
          </button>
          {zones?.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={clsx('rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all', selectedZoneId === zone.id ? 'bg-[#eef4ff] border border-[#d1e0ff] text-slate-900' : 'border border-transparent text-slate-700 hover:bg-slate-50')}
            >
              {zone.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <ListFilter size={16} className="mx-2 text-slate-500" />
          <button
            onClick={() => setSelectedStatus(undefined)}
            className={clsx('rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all', !selectedStatus ? 'bg-[#eef4ff] border border-[#d1e0ff] text-slate-900' : 'border border-transparent text-slate-700 hover:bg-slate-50')}
          >
            Tous
          </button>
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={clsx('rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all', selectedStatus === key ? 'bg-[#eef4ff] border border-[#d1e0ff] text-slate-900' : 'border border-transparent text-slate-700 hover:bg-slate-50')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LÉGENDE ET BOUTON D'AJOUT */}
      <div className="flex items-center gap-4 text-[14px] font-semibold text-slate-700 mb-1">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Libre</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#4f86f7]" /> Occupée</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Réservée</div>
        
        <Button variant="secondary" className="ml-auto text-sm py-1.5 h-auto" onClick={() => setShowNewTable(true)} icon={<Plus size={16} />}>
          Nouvelle Table
        </Button>
      </div>

      {/* 3. GRILLE DES TABLES */}
      {isLoading ? (
        <div className="py-12 text-center font-semibold text-slate-400">Chargement des tables...</div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {filteredTables?.map((table) => {
            const colors = STATUS_COLORS[table.status];
            const isSelected = selectedTableId === table.id;
            
            // NOUVEAU : Vérifier si cette table est celle qu'on est en train de transférer
            const isTransferSource = transferSourceTable?.id === table.id;
            const isTransferModeActive = transferSourceTable !== null;

            const activeOrder = table.orders?.find((o: any) => o.status !== 'PAID' && o.status !== 'CANCELLED');
            const total = activeOrder ? getOrderTotal(activeOrder) : null;
            const minutes = activeOrder ? minutesAgo(activeOrder.createdAt) : null;

            return (
              <div
                key={table.id}
                className={clsx(
                  'table-card relative flex flex-col items-center rounded-2xl border-[2.5px] transition-all p-3',
                  colors.border,
                  colors.bg,
                  // Griser la table source pendant un transfert
                  isTransferSource ? 'opacity-40 bg-slate-100 border-slate-300 pointer-events-none grayscale' : 'cursor-pointer hover:-translate-y-1 shadow-sm',
                  isSelected && !isTransferModeActive ? 'shadow-md scale-[1.02]' : ''
                )}
                style={{ minHeight: '190px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // LOGIQUE DE CLIC MODIFIÉE
                  if (isTransferModeActive) {
                    if (isTransferSource) return; // Ne peut pas se transférer sur elle-même
                    // Lancer l'API de transfert vers cette table
                    transferTable.mutate({ sourceId: transferSourceTable.id, targetId: table.id });
                  } else {
                    // Mode normal : ouvrir la barre d'outils
                    setSelectedTableId(isSelected ? null : table.id);
                  }
                }}
                onDoubleClick={() => {
                  if (isTransferModeActive) return; // Désactiver le double-clic pendant un transfert
                  const next = table.status === 'FREE' ? 'OCCUPIED' : table.status === 'OCCUPIED' ? 'RESERVED' : 'FREE';
                  updateStatus.mutate({ id: table.id, status: next });
                }}
              >
                
                {/* BARRE D'OUTILS FLOTTANTE */}
                {isSelected && !isTransferModeActive ? (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-slate-100 z-10 w-[85%] justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toast('Modifier la table ' + table.name); }}
                      className="flex-1 flex justify-center items-center py-2 bg-[#4f86f7] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Modifier la table"
                    >
                      <Pencil size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      // NOUVEAU : Activer le mode transfert au clic
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setTransferSourceTable(table);
                        setSelectedTableId(null);
                      }}
                      className="flex-1 flex justify-center items-center py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Transférer"
                    >
                      <ArrowLeftRight size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toast('Fusionner les tables'); }}
                      className="flex-1 flex justify-center items-center py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Fusionner"
                    >
                      <Combine size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <span className={clsx("text-[28px] font-bold tracking-tight leading-none mt-2", isTransferSource ? "text-slate-400" : "text-slate-900")}>
                    {table.name}
                  </span>
                )}

                <div className={clsx("flex flex-col items-center transition-all", isSelected && !isTransferModeActive ? "mt-16" : "mt-4")}>
                  <span className={clsx("flex items-center gap-2 text-[18px] font-bold tracking-tight", isTransferSource ? "text-slate-400" : "text-black")}>
                    <Users size={18} strokeWidth={2.5} />
                    {table.capacity} pers.
                  </span>

                  <span className={clsx('flex items-center gap-2 text-[18px] font-bold mt-2', isTransferSource ? "text-slate-400" : colors.text)}>
                    <span className={clsx('h-2 w-2 rounded-full', isTransferSource ? "bg-slate-400" : colors.dot)} />
                    {STATUS_LABEL[table.status]}
                  </span>
                </div>

                {total !== null && minutes !== null && (
                  <div className={clsx("w-full rounded-[14px] px-4 py-3 mt-auto shadow-sm flex justify-between items-center", isTransferSource ? "bg-slate-50" : "bg-white")}>
                    <div className="flex flex-col items-center justify-center leading-none gap-1">
                      <span className={clsx("text-[22px] font-bold tracking-tight", isTransferSource ? "text-slate-400" : colors.text)}>
                        {Math.round(total).toLocaleString('fr-DZ').replace(',', ' ')}
                      </span>
                      <span className={clsx("text-[16px] font-bold", isTransferSource ? "text-slate-400" : colors.text)}>DA</span>
                    </div>

                    <div className={clsx("flex flex-col items-center justify-center leading-none gap-1.5", isTransferSource ? "text-slate-400" : "text-black")}>
                      <span className="text-[14px] font-medium tracking-tight">il y a</span>
                      <span className="text-[18px] font-bold tracking-tight">{minutes} min</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NewTableModal
        isOpen={showNewTable}
        onClose={() => { setShowNewTable(false); setInitialZoneId(''); }}
        zones={zones ?? []}
        initialZoneId={initialZoneId}
      />
    </div>
  );
}

interface NewTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Array<{ id: string; name: string }>;
  initialZoneId?: string;
}

function NewTableModal({ isOpen, onClose, zones, initialZoneId }: NewTableModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zoneId, setZoneId] = useState(initialZoneId ?? '');

  useEffect(() => {
    if (isOpen) {
      setZoneId(initialZoneId ?? '');
      setName('');
      setCapacity('4');
    }
  }, [isOpen, initialZoneId]);

  const create = useMutation({
    mutationFn: async () => apiClient.post('/tables', { name, capacity: Number(capacity), zoneId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table créée avec succès');
      onClose();
    },
    onError: () => toast.error('Erreur lors de la création de la table'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle table" size="sm">
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