import { create } from 'zustand';
import type { PolygonFeature } from '@/entities/polygon';

interface SelectedPolygonState {
  selected: PolygonFeature | null;
  select: (polygon: PolygonFeature) => void;
  clear: () => void;
}

export const useSelectedPolygon = create<SelectedPolygonState>((set) => ({
  selected: null,
  select: (polygon) => set({ selected: polygon }),
  clear: () => set({ selected: null }),
}));
