/*
  Source: https://feathericons.com/?query=dark
  License: The MIT License (MIT)
  License URL: https://github.com/feathericons/feather/blob/main/LICENSE
*/

type DarkIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function DarkMoonIcon(props: DarkIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export { DarkMoonIcon };
