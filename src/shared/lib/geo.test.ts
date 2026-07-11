import type { Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import {
  closeRing,
  intersectionPoints,
  normalizeAntimeridian,
  polygonsIntersect,
  type LngLat,
} from './geo';

describe('normalizeAntimeridian', () => {
  it('переводит долготы >180° в диапазон [-180, 180] и ставит crosses=true (пример из ТЗ)', () => {
    // в ТЗ точки заданы как (широта, долгота), здесь порядок GeoJSON [lng, lat]
    const input: LngLat[] = [
      [174.2, 69.35],
      [204.96, 69.35],
      [205.49, 62.1],
      [173.67, 62.19],
    ];

    const { coords, crossesAntimeridian } = normalizeAntimeridian(input);

    expect(coords[0]).toEqual([174.2, 69.35]);
    expect(coords[1][0]).toBeCloseTo(-155.04, 10);
    expect(coords[2][0]).toBeCloseTo(-154.51, 10);
    expect(coords[3]).toEqual([173.67, 62.19]);
    // широты не меняются
    expect(coords.map(([, lat]) => lat)).toEqual([69.35, 69.35, 62.1, 62.19]);
    expect(crossesAntimeridian).toBe(true);
  });

  it('не меняет координаты в пределах [-180, 180] без перехода антимеридиана', () => {
    const input: LngLat[] = [
      [0, 20],
      [10, 20],
      [10, 28],
      [0, 28],
    ];

    const { coords, crossesAntimeridian } = normalizeAntimeridian(input);

    expect(coords).toEqual(input);
    expect(crossesAntimeridian).toBe(false);
  });

  it('определяет переход антимеридиана у координат, уже лежащих в диапазоне', () => {
    const input: LngLat[] = [
      [170, 60],
      [-170, 60],
      [-170, 68],
      [170, 68],
    ];

    const { coords, crossesAntimeridian } = normalizeAntimeridian(input);

    expect(coords).toEqual(input);
    expect(crossesAntimeridian).toBe(true);
  });

  it('поднимает долготы меньше -180° обратно в диапазон', () => {
    const input: LngLat[] = [
      [-190, 10],
      [-185, 15],
      [-170, 10],
    ];

    const { coords, crossesAntimeridian } = normalizeAntimeridian(input);

    expect(coords[0][0]).toBe(170);
    expect(coords[1][0]).toBe(175);
    expect(coords[2][0]).toBe(-170);
    expect(crossesAntimeridian).toBe(true);
  });

  it('справляется с экстремальными долготами без зависания', () => {
    const { coords } = normalizeAntimeridian([
      [1e20, 10],
      [-1e20, 15],
      [123456789, 20],
    ]);

    for (const [lng] of coords) {
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });

  it('возвращает пустой массив как есть', () => {
    const { coords, crossesAntimeridian } = normalizeAntimeridian([]);

    expect(coords).toEqual([]);
    expect(crossesAntimeridian).toBe(false);
  });
});

const polygon = (points: LngLat[]): Polygon => ({
  type: 'Polygon',
  coordinates: [closeRing(points)],
});

// кольцо через антимеридиан: 170 → -170
const bering = polygon([
  [170, 60],
  [-170, 60],
  [-170, 68],
  [170, 68],
]);

describe('polygonsIntersect', () => {

  it('полигон вдали от антимеридиана не задевает полигон через антимеридиан', () => {
    const piter = polygon([
      [30.2, 60.08],
      [30.55, 60.02],
      [30.55, 59.75],
      [30.35, 59.68],
      [30.0, 59.7],
      [29.75, 59.9],
    ]);

    expect(polygonsIntersect(bering, piter)).toBe(false);
  });

  it('находит пересечение с западной (отрицательной) стороны антимеридиана', () => {
    const insideWest = polygon([
      [-175, 62],
      [-172, 62],
      [-172, 66],
      [-175, 66],
    ]);

    expect(polygonsIntersect(bering, insideWest)).toBe(true);
    expect(polygonsIntersect(insideWest, bering)).toBe(true);
  });

  it('находит пересечение с восточной стороны антимеридиана', () => {
    const insideEast = polygon([
      [172, 62],
      [176, 62],
      [176, 66],
      [172, 66],
    ]);

    expect(polygonsIntersect(bering, insideEast)).toBe(true);
  });

  it('обычные полигоны: пересекающиеся и нет', () => {
    const a = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    const b = polygon([
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
    ]);
    const c = polygon([
      [20, 20],
      [25, 20],
      [25, 25],
      [20, 25],
    ]);

    expect(polygonsIntersect(a, b)).toBe(true);
    expect(polygonsIntersect(a, c)).toBe(false);
  });
});

describe('intersectionPoints', () => {
  it('находит точки, где границы квадратов пересекаются', () => {
    const a = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    const b = polygon([
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
    ]);

    const points = intersectionPoints(a, b);

    expect(points).toHaveLength(2);
    expect(points).toContainEqual([10, 5]);
    expect(points).toContainEqual([5, 10]);
  });

  it('пусто, если полигоны не касаются', () => {
    const a = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    const c = polygon([
      [20, 20],
      [25, 20],
      [25, 25],
      [20, 25],
    ]);

    expect(intersectionPoints(a, c)).toHaveLength(0);
  });

  it('находит пересечение границ через антимеридиан', () => {
    const west = polygon([
      [-175, 62],
      [-172, 62],
      [-172, 70],
      [-175, 70],
    ]);

    const points = intersectionPoints(bering, west);

    expect(points).toHaveLength(2);
    for (const [, lat] of points) {
      expect(lat).toBeCloseTo(68, 5);
    }
  });
});
