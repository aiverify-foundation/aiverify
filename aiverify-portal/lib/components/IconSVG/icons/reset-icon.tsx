/*
  Source: https://www.iconfinder.com/icons/9034422/reset_icon
  License: CC BY 4.0 DEED Attribution 4.0 International
  License URL: https://creativecommons.org/licenses/by/4.0/
*/

type ResetIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function ResetIcon(props: ResetIconProps) {
  const { color, width, height, className } = props;

  return (
    <svg
      viewBox="0 0 15 15"
      fill={color}
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export { ResetIcon };
