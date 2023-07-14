import React, { PropsWithChildren } from 'react';
import { IconName } from './iconNames';
import { ChevronLeft, PdfSvg, Trash, Pipeline } from './svg';

type IconProps = {
  name: IconName;
  style?: React.CSSProperties;
  color?: string;
  size?: number;
  onClick?: () => void;
};

function Icon(props: PropsWithChildren<IconProps>) {
  const { name, style, color = '#484747', size = 35, onClick } = props;

  function SvgComponent() {
    switch (name) {
      case IconName.PDF:
        return <PdfSvg size={size} color={color} />;
      case IconName.CHEVRON_LEFT:
        return <ChevronLeft size={size} color={color} />;
      case IconName.TRASH:
        return <Trash size={size} color={color} />;
      case IconName.PIPELINE:
        return <Pipeline size={size} color={color} />;
      default:
        return null;
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        ...style,
        width: size,
        height: size,
      }}
      onClick={onClick}>
      <SvgComponent />
    </div>
  );
}

export { Icon };
