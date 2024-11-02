/*
  Source: https://icons.getbootstrap.com/icons/layout-wtf/
  License: MIT License
  License URL: https://github.com/twbs/bootstrap/blob/main/LICENSE
*/

type LayoutWtfIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function LayoutWtfIcon(props: LayoutWtfIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill={color}
      viewBox="0 0 16 16"
      className={className}
    >
      <path d="M5 1v8H1V1zM1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm13 2v5H9V2zM9 1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM5 13v2H3v-2zm-2-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1zm12-1v2H9v-2zm-6-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
    </svg>
  );
}

export { LayoutWtfIcon };
