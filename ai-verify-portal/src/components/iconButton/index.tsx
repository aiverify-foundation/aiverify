//Wrapper for button which displays icon only

import { PropsWithChildren, FC } from 'react';
import clsx from 'clsx';
import styles from './styles/iconButton.module.css';

type IconProps = {
  style?: React.CSSProperties;
};

type IconButtonProps = {
  id?: string;
  iconComponent?: FC<IconProps>;
  rounded?: boolean;
  iconComponentStyle?: React.CSSProperties;
  iconFontSize?: number;
  noOutline?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  testId?: string;
};

function IconButton(props: PropsWithChildren<IconButtonProps>) {
  const {
    id,
    iconComponent: IconComponent,
    rounded = false,
    iconComponentStyle,
    iconFontSize = 20,
    disabled = false,
    noOutline = false,
    style,
    testId,
    children,
    onClick,
  } = props;

  function handleClick() {
    if (!disabled && onClick) {
      onClick();
    }
  }

  return (
    <button
      id={id}
      type="button"
      className={clsx(
        styles.iconBtn,
        rounded ? styles.iconBtn__rounded : null,
        disabled ? styles.iconBtn__disabled : null,
        noOutline ? styles.iconBtn__noOutline : null,
        'aiv_iconbtn'
      )}
      style={style}
      onClick={handleClick}
      data-testid={testId || id}>
      <div className={styles.btnContent}>
        {IconComponent ? (
          <IconComponent
            style={{
              fontSize: `${iconFontSize.toString()}px`,
              color: '#787878',
              ...iconComponentStyle,
            }}
          />
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
      </div>
    </button>
  );
}

export { IconButton };
