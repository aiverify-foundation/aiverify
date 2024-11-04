type WideArrowDownIconProps = {
  width: number;
  height: number;
  color: string;
  className?: string;
};

function WideArrowDownIcon(props: WideArrowDownIconProps) {
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
      <path d="M2 2L24 23L46 2" strokeWidth="5" />
    </svg>
  );
}

export { WideArrowDownIcon };
