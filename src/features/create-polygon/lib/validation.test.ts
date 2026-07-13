import { describe, expect, it } from 'vitest';
import { parsePointsText, validateLongitude } from './validation';

describe('validateLongitude', () => {
  it('пропускает долготу за пределами ±180, как в примере из ТЗ', () => {
    expect(validateLongitude('204.96')).toBeNull();
    expect(validateLongitude('-200')).toBeNull();
  });

  it('отклоняет не-число', () => {
    expect(validateLongitude('')).not.toBeNull();
    expect(validateLongitude('abc')).not.toBeNull();
  });

  it('отклоняет значения за пределами ±360, включая Infinity', () => {
    expect(validateLongitude('361')).not.toBeNull();
    expect(validateLongitude('-400')).not.toBeNull();
    expect(validateLongitude('Infinity')).not.toBeNull();
    expect(validateLongitude('1e20')).not.toBeNull();
  });
});

describe('parsePointsText', () => {
  it('разбирает "широта, долгота" в точки [lng, lat] с нормализацией', () => {
    const result = parsePointsText('69.35, 174.2\n69.35, 204.96\n62.1, 205.49');

    expect(result).toHaveProperty('points');
    const { points } = result as { points: [number, number][] };
    expect(points[0]).toEqual([174.2, 69.35]);
    expect(points[1][0]).toBeCloseTo(-155.04, 10);
    expect(points[1][1]).toBe(69.35);
  });

  it('отклоняет долготу за пределами ±360', () => {
    const result = parsePointsText('10, 1e20\n20, 30\n30, 40');

    expect(result).toEqual({ error: 'Строка 1: долгота должна быть от -360 до 360' });
  });
});
