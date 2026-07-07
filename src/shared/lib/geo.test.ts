import { describe, expect, it } from 'vitest';
import { normalizeAntimeridian, type LngLat } from './geo';

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

  it('возвращает пустой массив как есть', () => {
    const { coords, crossesAntimeridian } = normalizeAntimeridian([]);

    expect(coords).toEqual([]);
    expect(crossesAntimeridian).toBe(false);
  });
});
