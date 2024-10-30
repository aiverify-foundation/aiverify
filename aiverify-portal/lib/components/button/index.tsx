'use client';

import clsx from 'clsx';
import React, { ComponentProps, useState } from 'react';
import { Icon, IconName } from '../IconSVG';
import styles from './styles/button.module.css';

type BtnState = 'default' | 'hover' | 'pressed';
type BtnSize = 'sm' | 'md' | 'lg' | 'xs';
type IconPosition = 'left' | 'right';

enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline',
  LINK = 'link',
  TEXT = 'text',
}

type BaseButtonProps = ComponentProps<'button'> & {
  variant: ButtonVariant;
  text: string;
  size: BtnSize;
  color?: string;
  hoverColor?: string;
  pressedColor?: string;
  textColor?: string;
  icon?: IconName;
  iconPosition?: IconPosition;
  iconSize?: number;
  iconColor?: string;
  width?: React.CSSProperties['width'];
  pill?: boolean;
  bezel?: boolean;
};

type ButtonProps = BaseButtonProps &
  ({ icon?: undefined } | { icon: IconName; iconPosition: IconPosition }) &
  ({ iconPosition?: undefined } | { icon: IconName; iconPosition: IconPosition });

function Button(props: ButtonProps) {
  const {
    type = 'button',
    variant = ButtonVariant.PRIMARY,
    pill,
    size = 'md',
    color,
    hoverColor,
    pressedColor,
    textColor,
    iconPosition,
    icon,
    iconSize,
    iconColor,
    text,
    disabled = false,
    width,
    bezel = false,
    onClick,
  } = props;
  const [btnState, setBtnState] = useState<BtnState>('default');
  const cssClass = clsx(
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    pill && styles.pill,
    bezel && variant !== ButtonVariant.OUTLINE ? styles.bezel : styles.flat,
  );
  const bgColor = btnState === 'hover' ? hoverColor : btnState === 'pressed' ? pressedColor : color;
  let defaultIconSize = 16;
  let defaultIconColor = textColor;

  if (iconSize) {
    defaultIconSize = iconSize;
  } else {
    switch (size) {
      case 'lg':
        defaultIconSize = 22;
        break;
      case 'md':
        defaultIconSize = 18;
        break;
      case 'sm':
        defaultIconSize = 15;
        break;
      case 'xs':
        defaultIconSize = 14;
        break;
    }
  }

  if (iconColor) {
    defaultIconColor = iconColor;
  } else {
    switch (variant) {
      case ButtonVariant.PRIMARY:
        defaultIconColor = '#ffffff';
        break;
      case ButtonVariant.SECONDARY:
        defaultIconColor = '#ffffff';
        break;
      case ButtonVariant.OUTLINE:
        defaultIconColor = '#2554e1';
        break;
      case ButtonVariant.LINK:
        defaultIconColor = '#333333';
        break;
      case ButtonVariant.TEXT:
        defaultIconColor = '#2554e1';
        break;
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cssClass}
      style={{
        background: bgColor,
        color: textColor,
        width,
      }}
      onMouseEnter={() => setBtnState('hover')}
      onMouseLeave={() => setBtnState('default')}
      onMouseDown={() => setBtnState('pressed')}
      onMouseUp={() => setBtnState('hover')}
      onClick={onClick}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={defaultIconSize} color={defaultIconColor} />
      )}
      {text}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={defaultIconSize} color={defaultIconColor} />
      )}
    </button>
  );
}

export { Button, ButtonVariant };
