import booleanIntersects from '@turf/boolean-intersects';
import lineIntersect from '@turf/line-intersect';
import type { Geometry, Polygon } from 'geojson';

export type LngLat = [number, number];

export function closeRing(points: LngLat[]): LngLat[] {
  if (points.length === 0) return points;
  const [firstLng, firstLat] = points[0];
  const [lastLng, lastLat] = points[points.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return points;
  return [...points, [firstLng, firstLat]];
}

// ребро длиннее 180° по долготе - переход через антимеридиан
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
    const raw = ring[i][0];
    const prevLng = result[i - 1][0];
    const lng = raw - 360 * Math.round((raw - prevLng) / 360);
    result.push([lng, ring[i][1]]);
  }
  return result;
}

export interface NormalizedCoords {
  coords: LngLat[];
  crossesAntimeridian: boolean;
}

// остаток от деления вместо цикла - не зависнет на экстремальных значениях
function wrapLongitude(lng: number): number {
  if (lng >= -180 && lng <= 180) return lng;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

// загоняет долготы обратно в [-180, 180]
export function normalizeAntimeridian(coords: LngLat[]): NormalizedCoords {
  const normalized: LngLat[] = coords.map(([lng, lat]) => [wrapLongitude(lng), lat]);

  return {
    coords: normalized,
    crossesAntimeridian: crossesAntimeridian(normalized),
  };
}

function unwrapPolygon(polygon: Polygon): Polygon {
  return {
    type: 'Polygon',
    coordinates: polygon.coordinates.map((ring) => unwrapRing(ring as LngLat[])),
  };
}

function shiftPolygon(polygon: Polygon, delta: number): Polygon {
  if (delta === 0) return polygon;
  return {
    type: 'Polygon',
    coordinates: polygon.coordinates.map((ring) => ring.map(([lng, lat]) => [lng + delta, lat])),
  };
}

// DEV ONLY: используется только в mock-режиме, в проде источник истины - backend2 (intersection_coords)
// turf считает на плоскости и не знает про антимеридиан: кольцо 170 → -170
// для него - полоса через весь мир. Поэтому кольца разворачиваем, а второй
// полигон пробуем ещё со сдвигом ±360, чтобы поймать встречу через шов
export function polygonsIntersect(a: Polygon, b: Polygon): boolean {
  const planarA = unwrapPolygon(a);
  const planarB = unwrapPolygon(b);
  return [-360, 0, 360].some((delta) => booleanIntersects(planarA, shiftPolygon(planarB, delta)));
}

// DEV ONLY: используется только в mock-режиме, в проде источник истины - backend2 (intersection_coords)
// точки, где границы двух полигонов пересекают друг друга;
// сдвиги ±360 - по той же причине, что и в polygonsIntersect
export function intersectionPoints(a: Polygon, b: Polygon): LngLat[] {
  const planarA = unwrapPolygon(a);
  const planarB = unwrapPolygon(b);
  const points = new Map<string, LngLat>();
  for (const delta of [-360, 0, 360]) {
    for (const feature of lineIntersect(planarA, shiftPolygon(planarB, delta)).features) {
      const [lng, lat] = feature.geometry.coordinates as LngLat;
      points.set(`${lng.toFixed(9)},${lat.toFixed(9)}`, [lng, lat]);
    }
  }
  return [...points.values()];
}

function isLngLatPair(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function isPairList(value: unknown): value is LngLat[] {
  return Array.isArray(value) && value.length > 0 && value.every(isLngLatPair);
}

function isRingList(value: unknown): value is LngLat[][] {
  return Array.isArray(value) && value.length > 0 && value.every(isPairList);
}

// intersection_coords от backend2 - "сырые" вложенные координаты GEOS без типа геометрии;
// тип восстанавливается по вложенности: пара чисел - точка, список пар - линия,
// список колец - полигон, всё более глубокое (мультигеометрии, коллекции) - рекурсивно
export function parseIntersectionCoords(raw: unknown): Geometry[] {
  if (isLngLatPair(raw)) return [{ type: 'Point', coordinates: raw }];
  if (isPairList(raw)) return [{ type: 'LineString', coordinates: raw }];
  if (isRingList(raw)) return [{ type: 'Polygon', coordinates: raw }];
  if (Array.isArray(raw)) return raw.flatMap((part) => parseIntersectionCoords(part));
  return [];
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
