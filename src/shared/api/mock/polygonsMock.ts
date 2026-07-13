import { MOCK_API_DELAY_MS } from '@/shared/config';
import {
  closeRing,
  crossesAntimeridian,
  intersectionPoints,
  polygonsIntersect,
  type LngLat,
} from '@/shared/lib';
import type {
  CreatePolygonInput,
  CreatePolygonResult,
  PolygonApi,
  PolygonFeature,
  RejectedPolygonRecord,
} from '../types';

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS));

function buildFeature(name: string, coordinates: LngLat[]): PolygonFeature {
  const ring = closeRing(coordinates);
  return {
    type: 'Feature',
    properties: {
      id: crypto.randomUUID(),
      name,
      crossesAntimeridian: crossesAntimeridian(ring),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
}

const polygons: PolygonFeature[] = [
  buildFeature('Бермудский треугольник', [
    [-64.75, 32.31],
    [-80.19, 25.76],
    [-66.09, 18.43],
  ]),
  buildFeature('Сахара', [
    [0, 20],
    [10, 20],
    [10, 28],
    [0, 28],
  ]),
  buildFeature('Берингов пролив', [
    [170, 60],
    [-170, 60],
    [-170, 68],
    [170, 68],
  ]),
];

const rejected: RejectedPolygonRecord[] = [];

export const polygonsMockApi: PolygonApi = {
  async getPolygons(): Promise<PolygonFeature[]> {
    await delay();
    return structuredClone(polygons);
  },

  async getRejected(): Promise<RejectedPolygonRecord[]> {
    await delay();
    return structuredClone(rejected);
  },

  async searchByName(query: string): Promise<PolygonFeature[]> {
    await delay();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return structuredClone(
      polygons.filter((p) => p.properties.name.toLowerCase().includes(normalized)),
    );
  },

  async createPolygon(input: CreatePolygonInput): Promise<CreatePolygonResult> {
    await delay();
    const feature = buildFeature(input.name, input.coordinates);
    const conflicts = polygons.filter((existing) =>
      polygonsIntersect(existing.geometry, feature.geometry),
    );

    if (conflicts.length > 0) {
      const record: RejectedPolygonRecord = {
        feature,
        // DEV ONLY: в mock-режиме пересечения считает turf; в проде источник истины -
        // backend2 (intersection_coords)
        conflicts: conflicts.map((p) => ({
          id: p.properties.id,
          name: p.properties.name,
          intersections: intersectionPoints(p.geometry, feature.geometry).map((point) => ({
            type: 'Point' as const,
            coordinates: point,
          })),
        })),
        rejectedAt: new Date().toISOString(),
      };
      rejected.push(record);
      return { status: 'rejected', rejected: structuredClone(record) };
    }

    polygons.push(feature);
    return { status: 'created', polygon: structuredClone(feature) };
  },
};
