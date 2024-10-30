type DatabaseIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

function DatabaseIcon(props: DatabaseIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 49 54"
      fill={color}
      stroke="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M25.1996 0C11.6081 0 0.599609 4.475 0.599609 10C0.599609 15.525 11.6081 20 25.1996 20C38.7911 20 49.7996 15.525 49.7996 10C49.7996 4.475 38.7911 0 25.1996 0ZM0.599609 15V22.5C0.599609 28.025 11.6081 32.5 25.1996 32.5C38.7911 32.5 49.7996 28.025 49.7996 22.5V15C49.7996 20.525 38.7911 25 25.1996 25C11.6081 25 0.599609 20.525 0.599609 15ZM0.599609 27.5V35C0.599609 40.525 11.6081 45 25.1996 45C38.7911 45 49.7996 40.525 49.7996 35V27.5C49.7996 33.025 38.7911 37.5 25.1996 37.5C11.6081 37.5 0.599609 33.025 0.599609 27.5Z" />
    </svg>
  );
}

export { DatabaseIcon };
