type AsteriskIconProps = {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
};

function AsteriskIcon(props: AsteriskIconProps) {
  const { width, height, className, color } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 68 64"
      className={className}
      stroke={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M34.0496 2V62M57.5828 9.5L10.5163 54.5M65.4273 32H2.67188M57.5828 54.5L10.5163 9.5"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AsteriskIcon };
