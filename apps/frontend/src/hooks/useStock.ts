import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { PaginatedResponse, Product, StockCategory, StockEntry, StockOutput, Supplier } from '@/types';
import type { ProductFormValues, StockEntryFormValues, StockOutputFormValues } from '@/schemas';
import toast from 'react-hot-toast';

export function useProducts(params?: { search?: string; categoryId?: string; alert?: boolean; outOfStock?: boolean; page?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
      return data;
    },
  });
}

export function useProductAlerts() {
  return useQuery({
    queryKey: ['products', 'alerts'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products/alerts');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useStockCategories() {
  return useQuery({
    queryKey: ['stock-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<StockCategory[]>('/stock/categories');
      return data;
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params: { limit: 100 } });
      return data.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const { data } = await apiClient.post('/products', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé');
    },
    onError: () => toast.error('Erreur lors de la création du produit'),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ProductFormValues> }) => {
      const { data } = await apiClient.put(`/products/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
  });
}

export function useStockEntries(page = 1) {
  return useQuery({
    queryKey: ['stock-entries', page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<StockEntry>>('/stock/entries', { params: { page } });
      return data;
    },
  });
}

export function useCreateStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: StockEntryFormValues) => {
      const { data } = await apiClient.post('/stock/entries', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Entrée de stock enregistrée');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la saisie');
    },
  });
}

export function useStockOutputs(page = 1) {
  return useQuery({
    queryKey: ['stock-outputs', page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<StockOutput>>('/stock/outputs', { params: { page } });
      return data;
    },
  });
}

export function useCreateStockOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: StockOutputFormValues) => {
      const { data } = await apiClient.post('/stock/outputs', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-outputs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sortie de stock enregistrée');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la sortie de stock');
    },
  });
}
