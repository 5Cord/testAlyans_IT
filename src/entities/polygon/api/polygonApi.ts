import { polygonsMockApi } from '@/shared/api';
import type { CreatePolygonInput, CreatePolygonResult, PolygonFeature, RejectedPolygonRecord } from '@/shared/api';

// сейчас моки, при переходе на бэк заменить на fetch
export const polygonApi = {
  getPolygons: (): Promise<PolygonFeature[]> => polygonsMockApi.getPolygons(),

  getRejected: (): Promise<RejectedPolygonRecord[]> => polygonsMockApi.getRejected(),

  searchByName: (query: string): Promise<PolygonFeature[]> => polygonsMockApi.searchByName(query),

  createPolygon: (input: CreatePolygonInput): Promise<CreatePolygonResult> =>
    polygonsMockApi.createPolygon(input),
};

export const polygonKeys = {
  all: ['polygons'] as const,
  list: () => [...polygonKeys.all, 'list'] as const,
  rejected: () => [...polygonKeys.all, 'rejected'] as const,
  search: (query: string) => [...polygonKeys.all, 'search', query] as const,
};
