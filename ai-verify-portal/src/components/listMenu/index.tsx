import React, { PropsWithChildren } from 'react';
import styles from './styles/listMenu.module.css';

type ListMenuProps = {
  selectedIndex?: number;
  containerStyles?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
};

type ListMenuItemProps = {
  id: string;
  displayText: string;
  style?: React.CSSProperties;
  onClick: (id: string) => void;
};

function ListMenuItem(props: PropsWithChildren<ListMenuItemProps>) {
  const { id, style, displayText, children, onClick } = props;

  function handleOnClick(id: string) {
    return () => {
      if (onClick && typeof onClick === 'function') {
        onClick(id);
      }
    };
  }
  return (
    <div
      id={id}
      className={styles.listMenuItem}
      style={style}
      onClick={handleOnClick(id)}>
      <div className={styles.menuItemContent}>
        <div>{displayText}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function ListMenu(props: PropsWithChildren<ListMenuProps>) {
  const { containerStyles, children, onMouseEnter, onMouseLeave } = props;

  function handleMouseEnter(e: React.MouseEvent) {
    e.stopPropagation();
    if (onMouseEnter && typeof onMouseEnter === 'function') {
      onMouseEnter(e);
    }
  }

  function handleMouseLeave(e: React.MouseEvent) {
    e.stopPropagation();
    if (onMouseLeave && typeof onMouseLeave === 'function') {
      onMouseLeave(e);
    }
  }

  return (
    <div
      className={styles.listMenuContainer}
      style={containerStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

export { ListMenu, ListMenuItem };
