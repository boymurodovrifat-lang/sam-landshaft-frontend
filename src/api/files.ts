import { apiClient } from './client';
import type { GeotiffFile } from '../types';
import { encodeBbox, type Bbox } from '../lib/bbox';

export interface YearStatPoint {
  year: number;
  fileId: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  stdDev: number | null;
  validPixels: number;
}

export interface YearStatsResponse {
  categoryId: number;
  bbox: Bbox;
  years: YearStatPoint[];
}

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

  update: async (
    id: number,
    payload: { categoryId?: number; year?: number },
  ): Promise<GeotiffFile> => {
    const { data } = await apiClient.patch<GeotiffFile>(`/files/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  getDownloadUrl: (id: number, format: 'tiff' | 'jpg' = 'tiff'): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/files/${id}/download?format=${format}`;
  },

  /**
   * URL for the server-side cropped GeoTIFF download.
   * Server streams `image/tiff` with Content-Disposition: attachment.
   */
  getCropUrl: (id: number, bbox: Bbox): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/files/${id}/crop?bbox=${encodeURIComponent(encodeBbox(bbox))}`;
  },

  /**
   * Per-year statistics for a bbox in the given category.
   * Used by DetailYearTrend.
   */
  getYearStats: async (
    categoryId: number,
    bbox: Bbox,
  ): Promise<YearStatsResponse> => {
    const { data } = await apiClient.get<YearStatsResponse>('/files/stats', {
      params: { categoryId, bbox: encodeBbox(bbox) },
    });
    return data;
  },
};
