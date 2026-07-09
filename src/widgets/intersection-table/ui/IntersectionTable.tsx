import { useQuery } from '@tanstack/react-query';
import {
  polygonApi,
  polygonKeys,
  type RejectedPolygonRecord,
} from '@/entities/polygon';
import { usePolygonDetail } from '@/features/show-polygon-detail';
import { formatRing, type LngLat } from '@/shared/lib';
import styles from './IntersectionTable.module.css';

export function IntersectionTable() {
  const { data: rejected, isPending } = useQuery({
    queryKey: polygonKeys.rejected(),
    queryFn: polygonApi.getRejected,
  });

  const { data: polygons } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  const detail = usePolygonDetail((s) => s.detail);
  const showConflict = usePolygonDetail((s) => s.showConflict);
  const shownId = detail?.kind === 'conflict' ? detail.rejected.properties.id : undefined;

  const conflictNames = (record: RejectedPolygonRecord) =>
    record.conflictingIds
      .map((id) => polygons?.find((p) => p.properties.id === id)?.properties.name ?? '—')
      .join(', ');

  const handleRowClick = (record: RejectedPolygonRecord) => {
    const conflicts = (polygons ?? []).filter((p) =>
      record.conflictingIds.includes(p.properties.id),
    );
    showConflict(record.feature, conflicts);
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>
        Отклонённые полигоны{rejected?.length ? ` (${rejected.length})` : ''}
      </h2>

      {isPending && <p className={styles.hint}>Загрузка…</p>}
      {!isPending && !rejected?.length && <p className={styles.hint}>Отклонённых полигонов нет</p>}

      {!!rejected?.length && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Координаты (шир, долг)</th>
                <th>Пересекается с</th>
              </tr>
            </thead>
            <tbody>
              {rejected.map((record) => (
                <tr
                  key={record.feature.properties.id}
                  className={
                    record.feature.properties.id === shownId ? styles.selectedRow : undefined
                  }
                  onClick={() => handleRowClick(record)}
                >
                  <td>{record.feature.properties.name}</td>
                  <td className={styles.coords}>
                    {formatRing(record.feature.geometry.coordinates[0] as LngLat[])}
                  </td>
                  <td>{conflictNames(record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
