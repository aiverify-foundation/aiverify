type CloseIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function CloseIcon(props: CloseIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      className={className}
      stroke={color}
      fill="none"
    >
      <g id="cross">
        <line
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          x1="7"
          x2="25"
          y1="7"
          y2="25"
        />
        <line
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          x1="7"
          x2="25"
          y1="25"
          y2="7"
        />
      </g>
    </svg>
  );
}

export { CloseIcon };
