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
