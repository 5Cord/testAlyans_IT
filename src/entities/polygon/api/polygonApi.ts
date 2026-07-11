import { polygonsHttpApi } from '@/shared/api';
import type { PolygonApi } from '@/shared/api';

// ходим в бэк; моки (polygonsMockApi) остались на случай работы без него
export const polygonApi: PolygonApi = polygonsHttpApi;

export const polygonKeys = {
  all: ['polygons'] as const,
  list: () => [...polygonKeys.all, 'list'] as const,
  rejected: () => [...polygonKeys.all, 'rejected'] as const,
  search: (query: string) => [...polygonKeys.all, 'search', query] as const,
};
