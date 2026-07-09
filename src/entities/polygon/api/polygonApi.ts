import { polygonsMockApi } from '@/shared/api';
import type { PolygonApi } from '@/shared/api';

// сейчас моки; при переходе на бэк сюда встанет http-реализация того же PolygonApi
export const polygonApi: PolygonApi = polygonsMockApi;

export const polygonKeys = {
  all: ['polygons'] as const,
  list: () => [...polygonKeys.all, 'list'] as const,
  rejected: () => [...polygonKeys.all, 'rejected'] as const,
  search: (query: string) => [...polygonKeys.all, 'search', query] as const,
};
