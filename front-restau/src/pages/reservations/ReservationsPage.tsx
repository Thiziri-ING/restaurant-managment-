import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Phone, Clock, Users, Search, ListFilter, Calendar, Edit2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { apiClient } from '@/api/client';
import { useTables } from '@/hooks/useTables';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';
import toast from 'react-hot-toast';


// ── Schema ────────────────────────────────────────────────────
const reservationSchema = z.object({
  clientName: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
  dateTime: z.string().min(1, 'Date et heure requises'),
  guestCount: z.coerce.number().int().min(1, 'Au moins 1 personne'),
  durationMin: z.coerce.number().int().min(15).optional(),
  notes: z.string().optional(),
  tableId: z.string().uuid('Table requise'),
});
type ReservationFormValues = z.infer<typeof reservationSchema>;

const STATUS_COLOR: Record<string, 'green' | 'gray' | 'amber'> = {
  CONFIRMED: 'green',
  CANCELLED: 'gray',
  COMPLETED: 'amber',
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

// ── Hooks ─────────────────────────────────────────────────────
function useReservations(date: string) {
  return useQuery({
    queryKey: ['reservations', date],
    queryFn: async () => {
      const { data } = await apiClient.get('/reservations', { params: { date, limit: 50 } });
      return (data.data ?? []) as any[];
    },
    retry: false,
  });
}

function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      const { data } = await apiClient.post('/reservations', values);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation créée');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur lors de la réservation'),
  });
}

function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

// ── Form Modal ────────────────────────────────────────────────
function ReservationFormModal({ isOpen, onClose, selectedDate }: { isOpen: boolean; onClose: () => void; selectedDate: string }) {
  const { data: tables } = useTables();
  const createReservation = useCreateReservation();

  const defaultDateTime = `${selectedDate}T19:00`;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { clientName: '', phone: '', dateTime: defaultDateTime, guestCount: 2, durationMin: 60, notes: '', tableId: '' },
  });

  const onSubmit = (values: ReservationFormValues) => {
    createReservation.mutate(values, { onSuccess: () => { reset(); onClose(); } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle réservation">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nom du client *" error={errors.clientName?.message} {...register('clientName')} />
        <Input label="Téléphone" type="tel" {...register('phone')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date & heure *" type="datetime-local" error={errors.dateTime?.message} {...register('dateTime')} />
          <Input label="Durée (minutes)" type="number" step="15" {...register('durationMin')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre de couverts *" type="number" error={errors.guestCount?.message} {...register('guestCount')} />
          <Select label="Table *" error={errors.tableId?.message} {...register('tableId')}>
            <option value="">Sélectionner...</option>
            {tables?.map((t) => (
              <option key={t.id} value={t.id} disabled={t.status === 'OCCUPIED'}>
                {t.name} — {t.zone.name} ({t.capacity} couverts){t.status === 'OCCUPIED' ? ' [Occupée]' : ''}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Notes" {...register('notes')} />
        <Button type="submit" loading={createReservation.isPending} className="mt-2 w-full">
          Enregistrer la réservation
        </Button>
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-green-600">
          RÉSERVÉE
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
          ANNULÉE
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-600">
          DÉCALÉE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
          {status}
        </span>
      );
  }
};

export function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'confirmed' | 'delayed' | 'cancelled'>('all');

  const { data: reservations = [], isLoading } = useReservations(selectedDate);
  const updateStatus = useUpdateReservationStatus();

  const prevDay = () => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'));
  const nextDay = () => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'));

  const filteredReservations = reservations
    .filter((r: any) => {
      if (tabFilter === 'confirmed') return r.status === 'CONFIRMED';
      if (tabFilter === 'delayed') return r.status === 'COMPLETED';
      if (tabFilter === 'cancelled') return r.status === 'CANCELLED';
      return true;
    })
    .filter((r: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.clientName || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q);
    });

  const confirmedCount = reservations.filter((r: any) => r.status === 'CONFIRMED').length;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter Topbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-2 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none border-none cursor-pointer"
            />
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un client (nom, téléphone)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Tab Filters */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {([
              ['all',       'Toutes'   ],
              ['confirmed', 'Réservées'],
              ['delayed',   'Décalées'  ],
              ['cancelled', 'Annulées'  ],
            ] as const).map(([key, label]) => {
              const isActive = tabFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setTabFilter(key)}
                  className={clsx(
                    'rounded-lg px-3.5 py-1.5 text-xs font-black transition-all',
                    isActive
                      ? 'bg-blue-50 border border-blue-100 text-blue-600'
                      : 'border border-transparent text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>Nouvelle réservation</span>
        </button>
      </div>

      {/* ── Count Badge ── */}
      <div className="flex items-center mt-1">
        <span className="rounded-full bg-green-100/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-green-700">
          {confirmedCount} RÉSERVÉE{confirmedCount > 1 ? 'S' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Chargement...</div>
      ) : (
        <div className="mt-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">HEURE</th>
                    <th className="px-4 py-3">TABLE</th>
                    <th className="px-4 py-3">CLIENT</th>
                    <th className="px-4 py-3">TÉLÉPHONE</th>
                    <th className="px-4 py-3">PERS.</th>
                    <th className="px-4 py-3">DURÉE</th>
                    <th className="px-4 py-3">STATUT</th>
                    <th className="px-4 py-3 text-right pr-6">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Aucune réservation pour cette date.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations
                      .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                      .map((res: any) => (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>{dayjs(res.dateTime).format('HH:mm')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-800">{res.table?.name ?? '-'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-bold text-slate-800">{res.clientName}</p>
                              {res.notes && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                  <span>📝</span>
                                  <span className="truncate max-w-[220px]">{res.notes}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{res.phone ?? '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span>{res.guestCount}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-600 font-medium">
                            {res.durationMin ? `${res.durationMin} min` : '-'}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(res.status)}
                          </td>
                          <td className="px-4 py-4 text-right pr-6">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  toast.success(`Modifier la réservation de ${res.clientName}`);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateStatus.mutate({ id: res.id, status: 'COMPLETED' });
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <Clock size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Annuler cette réservation ?')) {
                                    updateStatus.mutate({ id: res.id, status: 'CANCELLED' });
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ReservationFormModal isOpen={showForm} onClose={() => setShowForm(false)} selectedDate={selectedDate} />
    </div>
  );
}