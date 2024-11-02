/*
  Source: https://feathericons.com/?query=file
  License: The MIT License (MIT)
  License URL: https://github.com/feathericons/feather/blob/main/LICENSE
*/

type FileIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function FileIcon(props: FileIconProps) {
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
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

export { FileIcon };
