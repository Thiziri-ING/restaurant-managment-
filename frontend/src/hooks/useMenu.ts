import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { MenuCategory, MenuItem, PaginatedResponse } from '@/types';

export function useMenuCategories() {
  return useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<MenuCategory[]>('/menu/categories');
      return data;
    },
  });
}

export function useMenuItems(params?: { categoryId?: string; available?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<MenuItem>>('/menu/items', {
        params: { ...params, limit: 100 },
      });
      return data;
    },
  });
}
