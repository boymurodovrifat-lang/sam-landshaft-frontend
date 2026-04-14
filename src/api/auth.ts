import { apiClient } from './client';
import type { AuthResponse, LoginPayload, Admin } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  me: async (): Promise<Admin> => {
    const { data } = await apiClient.get<Admin>('/auth/me');
    return data;
  },
};
