import type { Polygon } from 'geojson';

export type LngLat = [number, number];

export function closeRing(points: LngLat[]): LngLat[] {
  if (points.length === 0) return points;
  const [firstLng, firstLat] = points[0];
  const [lastLng, lastLat] = points[points.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return points;
  return [...points, [firstLng, firstLat]];
}

// ребро длиннее 180° по долготе — переход через антимеридиан
export function crossesAntimeridian(ring: LngLat[]): boolean {
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
  }
  return false;
}

// сдвигает долготы на ±360, чтобы соседние точки отличались меньше чем на 180°
export function unwrapRing(ring: LngLat[]): LngLat[] {
  if (ring.length === 0) return ring;
  const result: LngLat[] = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    let lng = ring[i][0];
    const prevLng = result[i - 1][0];
    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;
    result.push([lng, ring[i][1]]);
  }
  return result;
}

export interface NormalizedCoords {
  coords: LngLat[];
  crossesAntimeridian: boolean;
}

// загоняет долготы обратно в [-180, 180]
export function normalizeAntimeridian(coords: LngLat[]): NormalizedCoords {
  const normalized: LngLat[] = coords.map(([lng, lat]) => {
    let result = lng;
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
    return [result, lat];
  });

  return {
    coords: normalized,
    crossesAntimeridian: crossesAntimeridian(normalized),
  };
}

export function polygonBounds(polygon: Polygon): [LngLat, LngLat] {
  const ring = unwrapRing(polygon.coordinates[0] as LngLat[]);
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lng, lat] of ring) {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}
