type WideArrowUpIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function WideArrowUpIcon(props: WideArrowUpIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 26"
      fill="none"
      stroke={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M46 24L24 3L2 24" strokeWidth="5" />
    </svg>
  );
}

export { WideArrowUpIcon };
