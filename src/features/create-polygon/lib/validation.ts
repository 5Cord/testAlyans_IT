import { normalizeAntimeridian, type LngLat } from '@/shared/lib';

export function validateName(name: string, takenNames: string[]): string | null {
  if (!name.trim()) return 'Введите название полигона';
  const normalized = name.trim().toLowerCase();
  if (takenNames.some((taken) => taken.trim().toLowerCase() === normalized)) {
    return 'Полигон с таким названием уже есть';
  }
  return null;
}

export function validateLatitude(value: string): string | null {
  const num = Number(value.trim().replace(',', '.'));
  if (!value.trim() || Number.isNaN(num)) return 'Широта должна быть числом';
  if (num < -90 || num > 90) return 'Широта должна быть от -90 до 90';
  return null;
}

// долгота может выходить за ±180 (в ТЗ пример с 204.96), но в разумных пределах
export function validateLongitude(value: string): string | null {
  const num = Number(value.trim().replace(',', '.'));
  if (!value.trim() || Number.isNaN(num)) return 'Долгота должна быть числом';
  if (num < -360 || num > 360) return 'Долгота должна быть от -360 до 360';
  return null;
}

// строка — пара «широта, долгота», на выходе [lng, lat]
export function parsePointsText(text: string): { points: LngLat[] } | { error: string } {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const points: LngLat[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\s]+/).filter(Boolean);
    if (parts.length !== 2) {
      return { error: `Строка ${i + 1}: ожидается пара «широта, долгота»` };
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return { error: `Строка ${i + 1}: координаты должны быть числами` };
    }
    if (lat < -90 || lat > 90) {
      return { error: `Строка ${i + 1}: широта должна быть от -90 до 90` };
    }
    if (lng < -360 || lng > 360) {
      return { error: `Строка ${i + 1}: долгота должна быть от -360 до 360` };
    }
    points.push([lng, lat]);
  }

  if (points.length < 3) {
    return { error: 'Нужно минимум 3 точки для полигона' };
  }

  return { points: normalizeAntimeridian(points).coords };
}
