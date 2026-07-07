import { Providers } from './providers';
import { MapView } from '@/widgets/map-view';

export function App() {
  return (
    <Providers>
      <MapView />
    </Providers>
  );
}
