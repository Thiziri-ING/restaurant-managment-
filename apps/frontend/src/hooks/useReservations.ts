import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

export interface ApiReservation {
  id: string;
  clientName: string;
  phone?: string;
  dateTime: string;
  guestCount: number;
  durationMin: number;
  notes?: string;
  tableId: string;
  table?: { id: string; name: string; zone?: { id: string; name: string } };
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export function useReservations(date?: string) {
  return useQuery({
    queryKey: ['reservations', date],
    queryFn: async () => {
      const { data } = await apiClient.get('/reservations', { params: { date, limit: 100 } });
      return data.data as ApiReservation[];
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientName: string;
      phone?: string;
      dateTime: string;
      guestCount: number;
      durationMin?: number;
      notes?: string;
      tableId: string;
    }) => {
      const { data } = await apiClient.post('/reservations', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Réservation créée');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur lors de la création'),
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<{
      clientName: string;
      phone?: string;
      dateTime: string;
      guestCount: number;
      durationMin?: number;
      notes?: string;
      tableId: string;
    }>) => {
      const { data } = await apiClient.put(`/reservations/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation modifiée');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur lors de la modification'),
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }) => {
      const { data } = await apiClient.patch(`/reservations/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useDeleteReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/reservations/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation supprimée');
    },
  });
}