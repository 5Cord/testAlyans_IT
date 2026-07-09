import type { Feature, Polygon } from 'geojson';

export interface PolygonProperties {
  id: string;
  name: string;
  crossesAntimeridian: boolean;
}

export type PolygonFeature = Feature<Polygon, PolygonProperties>;

export interface RejectedPolygonRecord {
  feature: PolygonFeature;
  conflictingIds: string[];
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

// контракт слоя api: сейчас его реализуют моки, потом — клиент к бэку
export interface PolygonApi {
  getPolygons(): Promise<PolygonFeature[]>;
  getRejected(): Promise<RejectedPolygonRecord[]>;
  searchByName(query: string): Promise<PolygonFeature[]>;
  createPolygon(input: CreatePolygonInput): Promise<CreatePolygonResult>;
}
