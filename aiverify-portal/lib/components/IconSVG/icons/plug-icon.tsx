type PlugIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function PlugIcon(props: PlugIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 38 45"
      fill={color}
      className={className}>
      <path d="M31.0391 10V0H24.8891V10H12.5891V0H6.43906V10C3.36406 10 0.289062 12.5 0.289062 15V28.75L11.0516 37.5V45H26.4266V37.5L37.1891 28.75V15C37.1891 12.5 34.1141 10 31.0391 10Z" />
    </svg>
  );
}

export { PlugIcon };
