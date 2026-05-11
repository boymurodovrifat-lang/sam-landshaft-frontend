import { create } from 'zustand';
import type { Bbox } from '../lib/bbox';

export type DrawMode = 'idle' | 'drawing';

interface BboxState {
  bbox: Bbox | null;
  drawMode: DrawMode;
  setBbox: (b: Bbox | null) => void;
  startDrawing: () => void;
  cancelDrawing: () => void;
}

export const useBboxStore = create<BboxState>((set) => ({
  bbox: null,
  drawMode: 'idle',
  setBbox: (b) => set({ bbox: b, drawMode: 'idle' }),
  startDrawing: () => set({ drawMode: 'drawing', bbox: null }),
  cancelDrawing: () => set({ drawMode: 'idle' }),
}));
