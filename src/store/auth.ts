import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '../types';

interface AuthState {
  admin: Admin | null;
  token: string | null;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAuth: (admin, token) => {
        localStorage.setItem('samgeo_token', token);
        set({ admin, token });
      },
      logout: () => {
        localStorage.removeItem('samgeo_token');
        set({ admin: null, token: null });
      },
    }),
    { name: 'samgeo-auth' }
  )
);
