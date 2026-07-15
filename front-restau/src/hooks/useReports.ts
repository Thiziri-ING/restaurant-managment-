import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { DashboardKPIs } from '@/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardKPIs>('/reports/dashboard');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useSalesTimeline(from: string, to: string, granularity: 'day' | 'month' = 'day') {
  return useQuery({
    queryKey: ['sales-timeline', from, to, granularity],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/sales/timeline', {
        params: { from, to, granularity },
      });
      return data as Array<{ period: string; revenue: number; orderCount: number }>;
    },
  });
}

export function useTopItems(limit = 10) {
  return useQuery({
    queryKey: ['top-items', limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/top-items', { params: { limit } });
      return data as Array<{ id: string; name: string; totalQuantity: number; totalRevenue: number }>;
    },
  });
}

export function useStockState() {
  return useQuery({
    queryKey: ['stock-state'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/stock-state');
      return data;
    },
  });
}
