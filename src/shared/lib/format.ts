import type { LngLat } from './geo';

// срезает хвосты float-арифметики вида -155.04000000000002
const round = (n: number) => Math.round(n * 1e6) / 1e6;

// без замыкающей точки, в порядке «широта, долгота» — как вводится в форме;
// точки разделены переводом строки, ячейке нужен white-space: pre-line
export function formatRing(ring: LngLat[]): string {
  const points = ring.length > 1 ? ring.slice(0, -1) : ring;
  return points.map(([lng, lat]) => `${round(lat)}, ${round(lng)}`).join('\n');
}
