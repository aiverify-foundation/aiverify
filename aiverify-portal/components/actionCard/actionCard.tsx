import React from 'react';
import styles from './styles/actionCard.module.css';
import { Icon, IconName } from '../IconSVG';

type ActionCardProps = {
  title: string;
  titleSize?: number;
  description?: string;
  actionText?: string;
  cardColor?: string;
  textColor?: string;
  descriptionColor?: string;
  iconName: IconName;
  iconColor?: string;
  iconSize?: number;
  height?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
};

function ActionCard(props: ActionCardProps) {
  const {
    title,
    titleSize,
    description,
    iconName,
    iconSize = 50,
    iconColor = '#FFFFFF',
    cardColor = '#000000',
    textColor = '#FFFFFF',
    descriptionColor = '#FFFFFF',
    height,
    actionText,
    style,
    onClick,
  } = props;
  return (
    <figure
      className={styles.card}
      style={{ backgroundColor: cardColor, height, ...style }}
      onClick={onClick}
    >
      <Icon color={iconColor} name={iconName} size={iconSize} />
      <section>
        <h2 style={{ color: textColor, fontSize: titleSize }}>{title}</h2>
        <p style={{ color: descriptionColor || textColor }}>{description}</p>
      </section>
      <figcaption>
        {actionText && (
          <>
            <p style={{ color: textColor }}>{actionText}</p>
            <Icon name={IconName.ArrowRight} />
          </>
        )}
      </figcaption>
    </figure>
  );
}

export { ActionCard };
