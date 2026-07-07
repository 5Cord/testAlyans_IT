import { Providers } from './providers';
import { MapView } from '@/widgets/map-view';
import { PolygonForm } from '@/widgets/polygon-form';
import styles from './App.module.css';

export function App() {
  return (
    <Providers>
      <div className={styles.layout}>
        <MapView />
        <aside className={styles.panel}>
          <PolygonForm />
        </aside>
      </div>
    </Providers>
  );
}
