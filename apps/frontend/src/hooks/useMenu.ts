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

export function useMenuItems(params?: {
  categoryId?: string;
  available?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: async () => {
      // Construire les params en string pour éviter les problèmes de sérialisation boolean
      const queryParams: Record<string, string> = { limit: '100' };

      if (params?.categoryId) {
        queryParams.categoryId = params.categoryId;
      }
      if (params?.available !== undefined) {
        queryParams.available = params.available ? 'true' : 'false';
      }
      if (params?.search) {
        queryParams.search = params.search;
      }

      const { data } = await apiClient.get<PaginatedResponse<MenuItem>>(
        '/menu/items',
        { params: queryParams },
      );
      return data;
    },
  });
}