import { useEffect, useState, type FormEvent } from 'react';
import { useSearchPolygons } from '@/features/search-polygon';
import { usePolygonDetail } from '@/features/show-polygon-detail';
import styles from './PolygonSearch.module.css';

export function PolygonSearch() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  const { data: results, isFetching } = useSearchPolygons(query);
  const selectPolygon = usePolygonDetail((s) => s.selectPolygon);

  // единственное совпадение показываем сразу, без лишнего клика
  useEffect(() => {
    if (results?.length === 1) selectPolygon(results[0]);
  }, [results, selectPolygon]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setQuery(text);
  };

  return (
    <section className={styles.card}>
      <form className={styles.row} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Поиск полигона по названию"
        />
        <button type="submit" className={styles.button} disabled={isFetching}>
          Найти
        </button>
      </form>

      {query.trim() && results && (
        <>
          {results.length === 0 && <p className={styles.hint}>Ничего не нашлось</p>}
          {results.length > 1 && (
            <ul className={styles.results}>
              {results.map((polygon) => (
                <li key={polygon.properties.id}>
                  <button
                    type="button"
                    className={styles.resultButton}
                    onClick={() => selectPolygon(polygon)}
                  >
                    {polygon.properties.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
