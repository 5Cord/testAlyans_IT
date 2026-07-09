import { useQuery } from '@tanstack/react-query';
import { polygonApi, polygonKeys } from '@/entities/polygon';

export function useSearchPolygons(query: string) {
  const normalized = query.trim();
  return useQuery({
    queryKey: polygonKeys.search(normalized),
    queryFn: () => polygonApi.searchByName(normalized),
    enabled: normalized.length > 0,
  });
}
