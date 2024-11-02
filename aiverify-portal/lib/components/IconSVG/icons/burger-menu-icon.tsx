/*
  TODO - find another svg
*/

type BurgerMenuIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

function BurgerMenuIcon(props: BurgerMenuIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg width={width} height={height} viewBox="0 0 12 12" className={className} fill={color}>
      <g>
        <rect height="1" width="11" x="0.5" y="0" />
        <rect height="1" width="11" x="0.5" y="4.2" />
        <rect height="1" width="11" x="0.5" y="8.5" />
      </g>
    </svg>
  );
}

export { BurgerMenuIcon };
