import { create } from 'zustand';
import type { PolygonFeature } from '@/entities/polygon';

export type PolygonDetail =
  | { kind: 'polygon'; polygon: PolygonFeature }
  | { kind: 'conflict'; rejected: PolygonFeature; conflicts: PolygonFeature[] };

interface PolygonDetailState {
  detail: PolygonDetail | null;
  selectPolygon: (polygon: PolygonFeature) => void;
  showConflict: (rejected: PolygonFeature, conflicts: PolygonFeature[]) => void;
  clear: () => void;
}

export const usePolygonDetail = create<PolygonDetailState>((set) => ({
  detail: null,
  selectPolygon: (polygon) => set({ detail: { kind: 'polygon', polygon } }),
  showConflict: (rejected, conflicts) => set({ detail: { kind: 'conflict', rejected, conflicts } }),
  clear: () => set({ detail: null }),
}));
