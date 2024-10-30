type WideArrowRightIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function WideArrowRightIcon(props: WideArrowRightIconProps) {
  const {
    color,
    width,
    height,
    className,
  } = props;
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
      <path d="M2 46L23 24L2 2" stroke={color} strokeWidth="5" />
    </svg>
  );
}

export { WideArrowRightIcon };
