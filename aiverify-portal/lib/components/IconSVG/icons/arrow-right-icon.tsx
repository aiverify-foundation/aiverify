type ArrowRightIconProps = {
  width?: number;
  height?: number;
  className?: string;
  color: string;
};

function ArrowRightIcon(props: ArrowRightIconProps) {
  const { width, height, className, color } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export { ArrowRightIcon };
