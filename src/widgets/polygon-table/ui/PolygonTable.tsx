import { useQuery } from '@tanstack/react-query';
import { polygonApi, polygonKeys } from '@/entities/polygon';
import { usePolygonDetail } from '@/features/show-polygon-detail';
import { formatRing, type LngLat } from '@/shared/lib';
import styles from './PolygonTable.module.css';

export function PolygonTable() {
  const { data: polygons, isPending } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  const detail = usePolygonDetail((s) => s.detail);
  const selectPolygon = usePolygonDetail((s) => s.selectPolygon);
  const selectedId = detail?.kind === 'polygon' ? detail.polygon.properties.id : undefined;

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Полигоны{polygons?.length ? ` (${polygons.length})` : ''}</h2>

      {isPending && <p className={styles.hint}>Загрузка…</p>}
      {!isPending && !polygons?.length && <p className={styles.hint}>Пока нет ни одного полигона</p>}

      {!!polygons?.length && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Координаты (шир, долг)</th>
                <th>Антимеридиан</th>
              </tr>
            </thead>
            <tbody>
              {polygons.map((polygon) => (
                <tr
                  key={polygon.properties.id}
                  className={polygon.properties.id === selectedId ? styles.selectedRow : undefined}
                  onClick={() => selectPolygon(polygon)}
                >
                  <td>{polygon.properties.name}</td>
                  <td className={styles.coords}>
                    {formatRing(polygon.geometry.coordinates[0] as LngLat[])}
                  </td>
                  <td>
                    {polygon.properties.crossesAntimeridian ? (
                      <span className={styles.crossYes}>Пересекает</span>
                    ) : (
                      <span className={styles.crossNo}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
