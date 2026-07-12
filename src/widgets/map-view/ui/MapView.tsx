import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import type { FeatureCollection, Geometry } from 'geojson';
import { polygonApi, polygonKeys, type PolygonFeature } from '@/entities/polygon';
import { usePolygonDetail } from '@/features/show-polygon-detail';
import { MAP_STYLE_URL } from '@/shared/config';
import { polygonBounds, unwrapRing, type LngLat } from '@/shared/lib';
import styles from './MapView.module.css';

const POLYGONS_SOURCE = 'polygons';
const SELECTED_SOURCE = 'selected-polygon';
const REJECTED_SOURCE = 'rejected-polygon';
const INTERSECTIONS_SOURCE = 'intersection-points';

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

function unwrapGeometry(geometry: Geometry): Geometry {
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map((ring) => unwrapRing(ring as LngLat[])),
    };
  }
  if (geometry.type === 'LineString') {
    return { type: 'LineString', coordinates: unwrapRing(geometry.coordinates as LngLat[]) };
  }
  return geometry;
}

// геометрии пересечения от backend2 (intersection_coords) — точки, линии и полигоны
function toIntersectionCollection(geometries: Geometry[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geometries.map((geometry) => ({
      type: 'Feature',
      properties: {},
      geometry: unwrapGeometry(geometry),
    })),
  };
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const polygonsRef = useRef<PolygonFeature[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data: polygons } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  const detail = usePolygonDetail((s) => s.detail);
  const selectPolygon = usePolygonDetail((s) => s.selectPolygon);

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
      map.addSource(SELECTED_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'selected-fill',
        type: 'fill',
        source: SELECTED_SOURCE,
        paint: {
          'fill-color': '#f59e0b',
          'fill-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'selected-outline',
        type: 'line',
        source: SELECTED_SOURCE,
        paint: {
          'line-color': '#d97706',
          'line-width': 3,
        },
      });
      map.addSource(REJECTED_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'rejected-fill',
        type: 'fill',
        source: REJECTED_SOURCE,
        paint: {
          'fill-color': '#dc2626',
          'fill-opacity': 0.3,
        },
      });
      map.addLayer({
        id: 'rejected-outline',
        type: 'line',
        source: REJECTED_SOURCE,
        paint: {
          'line-color': '#b91c1c',
          'line-width': 3,
        },
      });
      map.addSource(INTERSECTIONS_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({
        id: 'intersection-fill',
        type: 'fill',
        source: INTERSECTIONS_SOURCE,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#b91c1c',
          'fill-opacity': 0.45,
        },
      });
      map.addLayer({
        id: 'intersection-lines',
        type: 'line',
        source: INTERSECTIONS_SOURCE,
        filter: ['!=', '$type', 'Point'],
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 2,
        },
      });
      map.addLayer({
        id: 'intersection-circles',
        type: 'circle',
        source: INTERSECTIONS_SOURCE,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#b91c1c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      setIsMapReady(true);
    });

    map.on('click', 'polygons-fill', (event) => {
      const id = event.features?.[0]?.properties?.id;
      const polygon = polygonsRef.current.find((p) => p.properties.id === id);
      if (polygon) selectPolygon(polygon);
    });
    map.on('mouseenter', 'polygons-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'polygons-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      setIsMapReady(false);
    };
  }, [selectPolygon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !polygons) return;
    polygonsRef.current = polygons;
    const source = map.getSource(POLYGONS_SOURCE) as GeoJSONSource | undefined;
    source?.setData(toDisplayCollection(polygons));
  }, [polygons, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    const selectedSource = map.getSource(SELECTED_SOURCE) as GeoJSONSource | undefined;
    const rejectedSource = map.getSource(REJECTED_SOURCE) as GeoJSONSource | undefined;
    const intersectionsSource = map.getSource(INTERSECTIONS_SOURCE) as GeoJSONSource | undefined;
    if (!selectedSource || !rejectedSource || !intersectionsSource) return;

    popupRef.current?.remove();
    popupRef.current = null;

    // подпись с названием над верхним краем полигона
    const showName = (name: string, [southWest, northEast]: [LngLat, LngLat]) => {
      popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat([(southWest[0] + northEast[0]) / 2, northEast[1]])
        .setText(name)
        .addTo(map);
    };

    if (!detail) {
      selectedSource.setData(EMPTY_COLLECTION);
      rejectedSource.setData(EMPTY_COLLECTION);
      intersectionsSource.setData(EMPTY_COLLECTION);
      return;
    }

    if (detail.kind === 'polygon') {
      selectedSource.setData(toDisplayCollection([detail.polygon]));
      rejectedSource.setData(EMPTY_COLLECTION);
      intersectionsSource.setData(EMPTY_COLLECTION);
      const bounds = polygonBounds(detail.polygon.geometry);
      showName(detail.polygon.properties.name, bounds);
      map.fitBounds(bounds, { padding: 80, maxZoom: 8 });
      return;
    }

    // отклонённый красным, пересечённые оранжевым, области/точки пересечения — данные backend2;
    // центрируемся по отклонённому — конфликтующие пересекают его, значит рядом
    selectedSource.setData(toDisplayCollection(detail.conflicts));
    rejectedSource.setData(toDisplayCollection([detail.rejected]));
    intersectionsSource.setData(toIntersectionCollection(detail.intersections));
    const bounds = polygonBounds(detail.rejected.geometry);
    showName(detail.rejected.properties.name, bounds);
    map.fitBounds(bounds, { padding: 80, maxZoom: 8 });
  }, [detail, isMapReady]);

  return <div ref={mapContainer} className={styles.map} />;
}
