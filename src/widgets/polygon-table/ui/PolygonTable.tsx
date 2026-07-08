import { useQuery } from '@tanstack/react-query';
import { polygonApi, polygonKeys, type PolygonFeature } from '@/entities/polygon';
import { useSelectedPolygon } from '@/features/show-polygon-detail';
import type { LngLat } from '@/shared/lib';
import styles from './PolygonTable.module.css';

// срезаем хвосты float-арифметики вида -155.04000000000002
const round = (n: number) => Math.round(n * 1e6) / 1e6;

// без замыкающей точки, в порядке «широта, долгота» — как вводится в форме
function formatCoords(feature: PolygonFeature): string {
  const ring = feature.geometry.coordinates[0] as LngLat[];
  const points = ring.length > 1 ? ring.slice(0, -1) : ring;
  return points.map(([lng, lat]) => `${round(lat)}, ${round(lng)}`).join('; ');
}

export function PolygonTable() {
  const { data: polygons, isPending } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  const selected = useSelectedPolygon((s) => s.selected);
  const select = useSelectedPolygon((s) => s.select);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Полигоны</h2>

      {isPending && <p className={styles.hint}>Загрузка…</p>}
      {!isPending && !polygons?.length && <p className={styles.hint}>Пока нет ни одного полигона</p>}

      {!!polygons?.length && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Координаты</th>
                <th>Антимеридиан</th>
              </tr>
            </thead>
            <tbody>
              {polygons.map((polygon) => (
                <tr
                  key={polygon.properties.id}
                  className={
                    polygon.properties.id === selected?.properties.id ? styles.selectedRow : undefined
                  }
                  onClick={() => select(polygon)}
                >
                  <td>{polygon.properties.name}</td>
                  <td className={styles.coords}>{formatCoords(polygon)}</td>
                  <td>{polygon.properties.crossesAntimeridian ? 'True' : 'False'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
