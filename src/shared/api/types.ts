import type { Feature, Geometry, Polygon } from 'geojson';

export interface PolygonProperties {
  id: string;
  name: string;
  crossesAntimeridian: boolean;
}

export type PolygonFeature = Feature<Polygon, PolygonProperties>;

export interface RejectedConflict {
  id: string;
  name: string;
  // геометрии пересечения, посчитанные backend2 (источник истины - PostGIS)
  intersections: Geometry[];
}

export interface RejectedPolygonRecord {
  feature: PolygonFeature;
  conflicts: RejectedConflict[];
  rejectedAt: string;
}

export interface CreatePolygonInput {
  name: string;
  // точки [lng, lat]
  coordinates: [number, number][];
}

export type CreatePolygonResult =
  | { status: 'created'; polygon: PolygonFeature }
  | { status: 'rejected'; rejected: RejectedPolygonRecord };

// ошибка бэка с осмысленным текстом (detail) - можно показывать пользователю как есть
export class ApiError extends Error {}

// контракт слоя api: сейчас его реализуют моки, потом - клиент к бэку
export interface PolygonApi {
  getPolygons(): Promise<PolygonFeature[]>;
  getRejected(): Promise<RejectedPolygonRecord[]>;
  searchByName(query: string): Promise<PolygonFeature[]>;
  createPolygon(input: CreatePolygonInput): Promise<CreatePolygonResult>;
}
