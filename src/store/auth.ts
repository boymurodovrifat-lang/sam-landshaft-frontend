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
        localStorage.setItem('sam_landshaft_token', token);
        set({ admin, token });
      },
      logout: () => {
        localStorage.removeItem('sam_landshaft_token');
        set({ admin: null, token: null });
      },
    }),
    { name: 'sam-landshaft-auth' }
  )
);
