type WarningIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function WarningIcon(props: WarningIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 31 30"
      stroke={color}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.1092 22.5C15.8022 22.5 16.3639 21.9404 16.3639 21.25C16.3639 20.5596 15.8022 20 15.1092 20C14.4163 20 13.8545 20.5596 13.8545 21.25C13.8545 21.9404 14.4163 22.5 15.1092 22.5Z"
        fill={color}
      />
      <path d="M15.1092 12.5V17.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.37799 22.632L12.8647 5.72217C13.7895 3.87955 16.4289 3.87956 17.3538 5.72217L25.8405 22.632C26.6747 24.2943 25.4615 26.25 23.596 26.25H6.62247C4.75701 26.25 3.54372 24.2943 4.37799 22.632Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { WarningIcon };
