import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { RestaurantTable, Zone } from '@/types';
import toast from 'react-hot-toast';

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data } = await apiClient.get<Zone[]>('/zones');
      return data;
    },
  });
}

export function useTables(zoneId?: string) {
  return useQuery({
    queryKey: ['tables', zoneId],
    queryFn: async () => {
      const { data } = await apiClient.get<RestaurantTable[]>('/tables', {
        params: zoneId ? { zoneId } : undefined,
      });
      return data;
    },
    refetchInterval: 10000, // poll toutes les 10s pour rester synchro
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/tables/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useMergeTables() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tableIds: string[]) => {
      const { data } = await apiClient.post('/tables/merge', { tableIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Tables fusionnées');
    },
    onError: () => toast.error('Erreur lors de la fusion'),
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/tables/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useTransferOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, toTableId }: { orderId: string; toTableId: string }) => {
      const { data } = await apiClient.post('/tables/transfer', { orderId, toTableId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Commande transférée');
    },
  });
}
