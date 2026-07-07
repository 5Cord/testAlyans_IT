import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import type { FeatureCollection } from 'geojson';
import { polygonApi, polygonKeys, type PolygonFeature } from '@/entities/polygon';
import { MAP_STYLE_URL } from '@/shared/config';
import { unwrapRing, type LngLat } from '@/shared/lib';
import styles from './MapView.module.css';

const POLYGONS_SOURCE = 'polygons';

const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

// развёртка долгот, чтобы полигоны через антимеридиан не тянулись через весь глобус
function toDisplayCollection(polygons: PolygonFeature[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: polygons.map((feature) => ({
      ...feature,
      geometry: {
        type: 'Polygon',
        coordinates: feature.geometry.coordinates.map((ring) => unwrapRing(ring as LngLat[])),
      },
    })),
  };
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data: polygons } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_URL,
      center: [0, 0],
      zoom: 1,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource(POLYGONS_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'polygons-fill',
        type: 'fill',
        source: POLYGONS_SOURCE,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.25,
        },
      });
      map.addLayer({
        id: 'polygons-outline',
        type: 'line',
        source: POLYGONS_SOURCE,
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
        },
      });
      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !polygons) return;
    const source = map.getSource(POLYGONS_SOURCE) as GeoJSONSource | undefined;
    source?.setData(toDisplayCollection(polygons));
  }, [polygons, isMapReady]);

  return <div ref={mapContainer} className={styles.map} />;
}
