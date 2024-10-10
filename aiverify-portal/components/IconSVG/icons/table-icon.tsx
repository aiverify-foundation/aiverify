/*
  Source: https://feathericons.com/?query=table
  License: The MIT License (MIT)
  License URL: https://github.com/feathericons/feather/blob/main/LICENSE
*/

type TableIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function TableIcon(props: TableIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  );
}

export { TableIcon };
