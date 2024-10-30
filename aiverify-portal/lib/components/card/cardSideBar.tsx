import styles from './styles/card.module.css';
import { useCardContext } from './cardContext';
type CardSideBarProps = {
  children: React.ReactNode;
  percentageWidth?: `${number}%`;
  className?: string;
};

function CardSideBar({ children, percentageWidth, className }: CardSideBarProps) {
  const { size } = useCardContext();
  return (
    <div
      style={{ width: percentageWidth }}
      className={`${styles.cardSideBar} ${styles[`cardSideBar_${size}`]} ${className}`}
    >
      {children}
    </div>
  );
}

export { CardSideBar };
