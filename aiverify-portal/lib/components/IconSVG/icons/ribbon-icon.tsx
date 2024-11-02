type RibbonIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function RibbonIcon(props: RibbonIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 19"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.75433 13.9464L7.40078 13.5929L7.04723 13.9464L3.00377 17.9899C2.04707 17.8913 1.30078 17.0827 1.30078 16.1V2.9C1.30078 1.85074 2.15152 1 3.20078 1H11.6008C12.65 1 13.5008 1.85074 13.5008 2.9V16.1C13.5008 17.0827 12.7545 17.8913 11.7978 17.9899L7.75433 13.9464Z" />
    </svg>
  );
}

export { RibbonIcon };
