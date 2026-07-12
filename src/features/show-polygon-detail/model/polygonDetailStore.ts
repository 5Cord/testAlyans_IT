import type { Geometry } from 'geojson';
import { create } from 'zustand';
import type { PolygonFeature } from '@/entities/polygon';

export type PolygonDetail =
  | { kind: 'polygon'; polygon: PolygonFeature }
  | {
      kind: 'conflict';
      rejected: PolygonFeature;
      conflicts: PolygonFeature[];
      // геометрии пересечения от backend2 (intersection_coords), фронт их не пересчитывает
      intersections: Geometry[];
    };

interface PolygonDetailState {
  detail: PolygonDetail | null;
  selectPolygon: (polygon: PolygonFeature) => void;
  showConflict: (
    rejected: PolygonFeature,
    conflicts: PolygonFeature[],
    intersections: Geometry[],
  ) => void;
  clear: () => void;
}

export const usePolygonDetail = create<PolygonDetailState>((set) => ({
  detail: null,
  selectPolygon: (polygon) => set({ detail: { kind: 'polygon', polygon } }),
  showConflict: (rejected, conflicts, intersections) =>
    set({ detail: { kind: 'conflict', rejected, conflicts, intersections } }),
  clear: () => set({ detail: null }),
}));
