type WideArrowLeftIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

function WideArrowLeftIcon(props: WideArrowLeftIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 26 48"
      fill="none"
      stroke={color}
      strokeWidth="3"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 2L3 24L24 46" strokeWidth="5" />
    </svg>
  );
}

export { WideArrowLeftIcon };
