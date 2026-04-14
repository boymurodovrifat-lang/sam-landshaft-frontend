import { apiClient } from './client';
import type { GeotiffFile } from '../types';

export const filesApi = {
  getAll: async (params?: { categoryId?: number; year?: number }): Promise<GeotiffFile[]> => {
    const { data } = await apiClient.get<GeotiffFile[]>('/files', { params });
    return data;
  },

  getOne: async (id: number): Promise<GeotiffFile> => {
    const { data } = await apiClient.get<GeotiffFile>(`/files/${id}`);
    return data;
  },

  upload: async (
    file: File,
    categoryId: number,
    year: number,
    onProgress?: (percent: number) => void
  ): Promise<GeotiffFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', String(categoryId));
    formData.append('year', String(year));

    const { data } = await apiClient.post<GeotiffFile>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  getDownloadUrl: (id: number, format: 'tiff' | 'jpg' = 'tiff'): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/files/${id}/download?format=${format}`;
  },
};
