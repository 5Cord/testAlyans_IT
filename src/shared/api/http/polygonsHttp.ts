import { API_URL } from '@/shared/config';
import { closeRing, crossesAntimeridian, parseIntersectionCoords, type LngLat } from '@/shared/lib';
import {
  ApiError,
  type CreatePolygonInput,
  type CreatePolygonResult,
  type PolygonApi,
  type PolygonFeature,
  type RejectedConflict,
  type RejectedPolygonRecord,
} from '../types';

// фича территории в том виде, как её отдаёт бэк (drf-gis)
interface TerritoryFeature {
  type: 'Feature';
  id: number;
  geometry: PolygonFeature['geometry'];
  properties: {
    name: string;
    crosses_antimeridian: boolean;
    created_at: string;
  };
}

// intersection_coords — вложенные координаты GEOS, формат описан в PROJECT_CONTRACT.md
interface ConflictResponse {
  id: number;
  name: string;
  intersection_coords?: unknown;
}

interface RejectedResponse {
  id: number;
  name: string;
  coords: LngLat[];
  conflicts: ConflictResponse[];
  created_at: string;
}

interface CreateErrorBody {
  detail?: string;
  conflicts?: ConflictResponse[];
}

async function http<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function toFeature(territory: TerritoryFeature): PolygonFeature {
  return {
    type: 'Feature',
    properties: {
      id: String(territory.id),
      name: territory.properties.name,
      crossesAntimeridian: territory.properties.crosses_antimeridian,
    },
    geometry: territory.geometry,
  };
}

function buildFeature(id: string, name: string, coordinates: LngLat[]): PolygonFeature {
  const ring = closeRing(coordinates);
  return {
    type: 'Feature',
    properties: { id, name, crossesAntimeridian: crossesAntimeridian(ring) },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

function toConflicts(conflicts: ConflictResponse[]): RejectedConflict[] {
  return conflicts.map((conflict) => ({
    id: String(conflict.id),
    name: conflict.name,
    intersections: parseIntersectionCoords(conflict.intersection_coords),
  }));
}

export const polygonsHttpApi: PolygonApi = {
  async getPolygons(): Promise<PolygonFeature[]> {
    const collection = await http<{ features: TerritoryFeature[] }>('/api/territories/');
    return collection.features.map(toFeature);
  },

  async getRejected(): Promise<RejectedPolygonRecord[]> {
    const records = await http<RejectedResponse[]>('/api/rejected/');
    return records.map((record) => ({
      feature: buildFeature(String(record.id), record.name, record.coords),
      conflicts: toConflicts(record.conflicts),
      rejectedAt: record.created_at,
    }));
  },

  async searchByName(query: string): Promise<PolygonFeature[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const polygons = await polygonsHttpApi.getPolygons();
    return polygons.filter((p) => p.properties.name.toLowerCase().includes(normalized));
  },

  async createPolygon(input: CreatePolygonInput): Promise<CreatePolygonResult> {
    const response = await fetch(`${API_URL}/api/territories/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.name, coords: input.coordinates }),
    });

    if (response.ok) {
      const created: TerritoryFeature = await response.json();
      return { status: 'created', polygon: toFeature(created) };
    }

    const body: CreateErrorBody | null = await response.json().catch(() => null);
    if (response.status === 400 && Array.isArray(body?.conflicts)) {
      return {
        status: 'rejected',
        rejected: {
          feature: buildFeature(crypto.randomUUID(), input.name, input.coordinates),
          conflicts: toConflicts(body.conflicts),
          rejectedAt: new Date().toISOString(),
        },
      };
    }
    if (body?.detail) throw new ApiError(body.detail);
    throw new Error(`HTTP ${response.status}`);
  },
};
