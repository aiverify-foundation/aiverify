import React, { useRef, useEffect } from 'react';
import VanillaTilt from 'vanilla-tilt';
import styles from './styles/card.module.css';
import clsx from 'clsx';

type CardProps = {
  size: 's' | 'm' | 'l';
  cardColor?: string;
  disableTiltEffect?: boolean;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
};

function Card(props: CardProps) {
  const {
    size = 'm',
    cardColor,
    disableTiltEffect,
    height,
    style,
    className,
    children,
    onClick,
  } = props;

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && !disableTiltEffect) {
      VanillaTilt.init(cardRef.current, {
        max: 5,
        speed: 400,
        glare: true,
        'max-glare': 0.5,
      });
    }

    return () => {
      if (cardRef.current && !disableTiltEffect) {
        cardRef.current.vanillaTilt.destroy();
      }
    };
  }, [disableTiltEffect]);

  return (
    <figure
      ref={cardRef}
      className={clsx(
        styles.card,
        styles[`card_${size}`],
        'bg-gradient-to-b from-secondary-600 to-secondary-700 dark:bg-secondary-700',
        className,
      )}
      style={{ backgroundColor: cardColor, height, ...style }}
      onClick={onClick}
    >
      {children}
    </figure>
  );
}

export { Card };
