import { PropsWithChildren } from 'react';
import styles from './styles/card.module.css';

type CardContentProps = {
  className?: string;
};

function CardContent({ children, className }: PropsWithChildren<CardContentProps>) {
  return <div className={`${styles.cardContent} ${className}`}>{children}</div>;
}

export { CardContent };
