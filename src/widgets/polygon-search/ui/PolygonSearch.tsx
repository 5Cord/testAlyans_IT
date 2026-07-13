import { useEffect, useState } from 'react';
import { useSearchPolygons } from '@/features/search-polygon';
import { usePolygonDetail } from '@/features/show-polygon-detail';
import styles from './PolygonSearch.module.css';

export function PolygonSearch() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  // ищем по мере ввода, с паузой, чтобы не дёргать апи на каждую букву
  useEffect(() => {
    const id = setTimeout(() => setQuery(text), 300);
    return () => clearTimeout(id);
  }, [text]);

  const { data: results } = useSearchPolygons(query);
  const selectPolygon = usePolygonDetail((s) => s.selectPolygon);

  // единственное совпадение показываем сразу, без лишнего клика
  useEffect(() => {
    if (results?.length === 1) selectPolygon(results[0]);
  }, [results, selectPolygon]);

  return (
    <section className={styles.card}>
      <input
        className={styles.input}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Поиск полигона по названию"
      />

      {query.trim() && results && (
        <>
          {results.length === 0 && <p className={styles.hint}>Ничего не нашлось</p>}
          {results.length === 1 && (
            <p className={styles.hint}>Найден полигон "{results[0].properties.name}"</p>
          )}
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
