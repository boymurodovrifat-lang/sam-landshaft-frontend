import { apiClient } from './client';
import type { Category, CategoryPayload } from '../types';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },

  getTree: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/categories/tree');
    return data;
  },

  getOne: async (id: number): Promise<Category> => {
    const { data } = await apiClient.get<Category>(`/categories/${id}`);
    return data;
  },

  create: async (payload: CategoryPayload): Promise<Category> => {
    const { data } = await apiClient.post<Category>('/categories', payload);
    return data;
  },

  update: async (id: number, payload: Partial<CategoryPayload>): Promise<Category> => {
    const { data } = await apiClient.patch<Category>(`/categories/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  applyPreset: async (id: number): Promise<Category> => {
    const { data } = await apiClient.post<Category>(`/categories/${id}/apply-preset`);
    return data;
  },
};
