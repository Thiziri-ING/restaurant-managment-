import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Phone, Clock, Users } from 'lucide-react';
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
      return data.data as any[];
    },
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
export function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showForm, setShowForm] = useState(false);

  const { data: reservations, isLoading } = useReservations(selectedDate);
  const updateStatus = useUpdateReservationStatus();

  const prevDay = () => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'));
  const nextDay = () => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'));
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Réservations</h1>
          <p className="text-sm text-slate-500">Planning des réservations</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
          Nouvelle réservation
        </Button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-base font-semibold text-slate-800">
            {dayjs(selectedDate).format('dddd DD MMMM YYYY')}
          </span>
          {isToday && <span className="text-xs text-primary-600 font-medium">Aujourd'hui</span>}
        </div>
        <button onClick={nextDay} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <ChevronRight size={18} />
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Reservation cards */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Chargement...</div>
      ) : (reservations?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Clock size={40} className="text-slate-200" />
          <p className="text-slate-400">Aucune réservation pour cette journée</p>
          <Button variant="ghost" onClick={() => setShowForm(true)}>Créer une réservation</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reservations?.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .map((res) => (
              <div
                key={res.id}
                className={clsx(
                  'rounded-xl border p-4 flex flex-col gap-3',
                  res.status === 'CANCELLED' ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white shadow-sm',
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{res.clientName}</p>
                    <p className="text-xs text-slate-400">{res.table?.name} — {res.table?.zone?.name}</p>
                  </div>
                  <Badge color={STATUS_COLOR[res.status] ?? 'gray'}>{STATUS_LABEL[res.status]}</Badge>
                </div>

                <div className="flex gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Clock size={13} />{dayjs(res.dateTime).format('HH:mm')}</span>
                  <span className="flex items-center gap-1"><Users size={13} />{res.guestCount} pers.</span>
                  {res.phone && <span className="flex items-center gap-1"><Phone size={13} />{res.phone}</span>}
                </div>

                {res.notes && <p className="text-xs text-slate-500 italic">{res.notes}</p>}

                {res.status === 'CONFIRMED' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus.mutate({ id: res.id, status: 'COMPLETED' })}
                      className="flex-1 rounded-lg bg-emerald-50 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Terminer
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: res.id, status: 'CANCELLED' })}
                      className="flex-1 rounded-lg bg-red-50 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <ReservationFormModal isOpen={showForm} onClose={() => setShowForm(false)} selectedDate={selectedDate} />
    </div>
  );
}
