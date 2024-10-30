/*
  Source: https://www.iconfinder.com/search?q=box&price=free&style=solid&license=gte__1
  License: The MIT License (MIT)
  License URL: https://creativecommons.org/licenses/by/4.0/
*/

type SolidBoxIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

function SolidBoxIcon(props: SolidBoxIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      fill={color}
      stroke="none"
      height={height}
      viewBox="0 0 15 15"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M7.30298 0.0404275C7.42875 -0.0134758 7.57112 -0.0134758 7.6969 0.0404275L14.5 2.95605L7.50002 5.95604L0.499949 2.95601L7.30298 0.0404275Z" />
      <path d="M-6.10352e-05 3.82969V11.5C-6.10352e-05 11.7 0.119137 11.8808 0.302979 11.9596L6.99994 14.8297V6.82969L-6.10352e-05 3.82969Z" />
      <path d="M7.99994 6.82976L14.9999 3.82976V11.5C14.9999 11.7 14.8807 11.8808 14.6969 11.9596L7.99994 14.8297V6.82976Z" />
    </svg>
  );
}

export { SolidBoxIcon };
