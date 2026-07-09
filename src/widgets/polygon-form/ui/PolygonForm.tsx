import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { polygonApi, polygonKeys } from '@/entities/polygon';
import {
  parsePointsText,
  useCreatePolygon,
  validateLatitude,
  validateLongitude,
  validateName,
} from '@/features/create-polygon';
import { CollapseCard } from '@/shared/ui';
import styles from './PolygonForm.module.css';

interface FormErrors {
  name?: string;
  lat?: string;
  lng?: string;
  points?: string;
}

export function PolygonForm() {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate, isPending } = useCreatePolygon();

  const { data: polygons } = useQuery({
    queryKey: polygonKeys.list(),
    queryFn: polygonApi.getPolygons,
  });

  const handleAddPoint = () => {
    const latError = validateLatitude(lat);
    const lngError = validateLongitude(lng);
    if (latError || lngError) {
      setErrors({ lat: latError ?? undefined, lng: lngError ?? undefined });
      return;
    }
    const latNum = Number(lat.trim().replace(',', '.'));
    const lngNum = Number(lng.trim().replace(',', '.'));
    const line = `${latNum}, ${lngNum}`;
    setPointsText((prev) => (prev.trim() ? `${prev.trimEnd()}\n${line}` : line));
    setLat('');
    setLng('');
    setErrors({});
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const takenNames = polygons?.map((p) => p.properties.name) ?? [];
    const nameError = validateName(name, takenNames);
    const parsed = parsePointsText(pointsText);
    const pointsError = 'error' in parsed ? parsed.error : undefined;

    if (nameError || pointsError) {
      setErrors({ name: nameError ?? undefined, points: pointsError });
      return;
    }
    setErrors({});

    mutate(
      { name: name.trim(), coordinates: (parsed as { points: [number, number][] }).points },
      {
        onSuccess: (result) => {
          if (result.status === 'created') {
            setName('');
            setPointsText('');
          }
        },
      },
    );
  };

  return (
    <CollapseCard title="Новый полигон">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Название</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Тестовый полигон"
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </label>

        <div className={styles.coords}>
          <label className={styles.field}>
            <span className={styles.label}>Широта</span>
            <input
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="55.75"
            />
            {errors.lat && <span className={styles.error}>{errors.lat}</span>}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Долгота</span>
            <input
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="37.62"
            />
            {errors.lng && <span className={styles.error}>{errors.lng}</span>}
          </label>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={handleAddPoint}>
          Добавить
        </button>

        <label className={styles.field}>
          <span className={styles.label}>Координаты (широта, долгота — по строке на точку)</span>
          <textarea
            className={styles.textarea}
            rows={6}
            value={pointsText}
            onChange={(e) => setPointsText(e.target.value)}
            placeholder={'55.75, 37.62\n55.80, 37.70\n55.70, 37.75'}
          />
          {errors.points && <span className={styles.error}>{errors.points}</span>}
        </label>

        <button type="submit" className={styles.submitButton} disabled={isPending}>
          {isPending ? 'Сохранение…' : 'Submit'}
        </button>
      </form>
    </CollapseCard>
  );
}
