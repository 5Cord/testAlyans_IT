import type { ReactNode } from 'react';
import styles from './CollapseCard.module.css';

interface CollapseCardProps {
  title: string;
  children: ReactNode;
}

// нативный details: открыт по умолчанию, состояние держит сам браузер
export function CollapseCard({ title, children }: CollapseCardProps) {
  return (
    <details className={styles.card} open>
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
