import { Providers } from './providers';
import { IntersectionTable } from '@/widgets/intersection-table';
import { MapView } from '@/widgets/map-view';
import { PolygonForm } from '@/widgets/polygon-form';
import { PolygonSearch } from '@/widgets/polygon-search';
import { PolygonTable } from '@/widgets/polygon-table';
import styles from './App.module.css';

export function App() {
  return (
    <Providers>
      <div className={styles.layout}>
        <MapView />
        <aside className={styles.panel}>
          <PolygonForm />
        </aside>
        <aside className={styles.panelRight}>
          <PolygonSearch />
          <PolygonTable />
          <IntersectionTable />
        </aside>
      </div>
    </Providers>
  );
}
