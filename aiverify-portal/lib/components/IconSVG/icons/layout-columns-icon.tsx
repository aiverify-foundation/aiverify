/*
  Source: https://icons.getbootstrap.com/icons/layout-three-columns/
  License: MIT License
  License URL: https://github.com/twbs/bootstrap/blob/main/LICENSE
*/

type LayoutColumnsIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function LayoutColumnsIcon(props: LayoutColumnsIconProps) {
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
      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5H5V1zM10 15V1H6v14zm1 0h3.5a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5H11z" />
    </svg>
  );
}

export { LayoutColumnsIcon };
