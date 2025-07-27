'use client';

import React, { useRef, useEffect } from 'react';
import VanillaTilt from 'vanilla-tilt';
import { CardContent } from './cardContent';
import { CardProvider } from './cardContext';
import { CardSideBar } from './cardSideBar';
import styles from './styles/card.module.css';

type CommonCardProps = {
  size: 'sm' | 'md' | 'lg';
  cardColor?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

type BaseTiltProps = {
  tiltRotation?: number;
  tiltSpeed?: number;
};

type TiltPropsWithoutGlare = BaseTiltProps & {
  enableTiltGlare?: false;
  tiltMaxGlare?: never;
};

type TiltPropsWithGlare = BaseTiltProps & {
  enableTiltGlare: true;
  tiltMaxGlare: number;
};

type TiltProps = TiltPropsWithoutGlare | TiltPropsWithGlare;

type CardWithoutTilt = CommonCardProps & {
  enableTiltEffect?: false | undefined;
  tiltRotation?: never;
  tiltSpeed?: never;
  enableTiltGlare?: never;
  tiltMaxGlare?: never;
};

type CardWithTilt = CommonCardProps &
  TiltProps & {
    enableTiltEffect: true;
  };

type CardProps = CardWithoutTilt | CardWithTilt;

function Card(props: CardProps) {
  const {
    size = 'md',
    cardColor,
    enableTiltEffect,
    height,
    width,
    style,
    className,
    children,
    onClick,
    tiltRotation,
    tiltSpeed,
    enableTiltGlare,
    tiltMaxGlare,
  } = props;
  const cardRef = useRef<
    HTMLDivElement & { vanillaTilt: { destroy: () => void } }
  >(null);

  useEffect(() => {
    const tiltedElem = cardRef.current;

    if (tiltedElem && enableTiltEffect) {
      VanillaTilt.init(tiltedElem, {
        max: tiltRotation,
        speed: tiltSpeed,
        glare: enableTiltGlare,
        'max-glare': tiltMaxGlare,
      });
    }

    return () => {
      if (tiltedElem && enableTiltEffect) {
        tiltedElem.vanillaTilt.destroy();
      }
    };
  }, [
    enableTiltEffect,
    tiltRotation,
    tiltSpeed,
    enableTiltGlare,
    tiltMaxGlare,
  ]);

  return (
    <CardProvider value={{ size }}>
      <div
        ref={cardRef}
        data-testid="card"
        className={`${styles.card} ${styles[`card_${size}`]} ${className}`}
        style={{
          height,
          width,
          ...(cardColor
            ? { backgroundColor: cardColor }
            : {
                backgroundImage:
                  'linear-gradient(to bottom, var(--color-primary-900), var(--color-primary-700))',
              }),
          ...style,
        }}
        onClick={onClick}>
        <div className={styles.cardFlexbox}>{children}</div>
      </div>
    </CardProvider>
  );
}

Card.SideBar = CardSideBar;
Card.Content = CardContent;
export { Card };
