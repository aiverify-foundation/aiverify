type ArrowLeftIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function ArrowLeftIcon(props: ArrowLeftIconProps) {
  const { width, height, color, className } = props;
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export { ArrowLeftIcon };
