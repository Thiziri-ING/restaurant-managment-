import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

export function useActiveOrders() {
  return useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<Order[]>('/orders/active');
      return data;
    },
    refetchInterval: 8000,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: string;
      tableId?: string;
      notes?: string;
      items: Array<{ menuItemId: string; quantity: number; discount?: number; isOffer?: boolean }>;
    }) => {
      const { data } = await apiClient.post<Order>('/orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Commande créée');
    },
    onError: () => toast.error('Erreur lors de la création de la commande'),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useApplyDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, discount }: { id: string; discount: number }) => {
      const { data } = await apiClient.post(`/orders/${id}/discount`, { discount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Remise appliquée');
    },
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      payments,
    }: {
      orderId: string;
      payments: Array<{ method: string; amount: number }>;
    }) => {
      const { data } = await apiClient.post(`/invoices/${orderId}`, { payments });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Facture générée');
    },
    onError: () => toast.error('Erreur lors de la facturation'),
  });
}
