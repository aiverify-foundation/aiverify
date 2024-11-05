type MoonshotAttackIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function MoonshotAttackStrategyIcon(props: MoonshotAttackIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 21"
      stroke={color}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="10" cy="10.5" r="9" stroke={color} strokeWidth="2" />
      <path
        d="M6.64205 15H4.39205L8.48864 3.36364H11.0909L15.1932 15H12.9432L9.83523 5.75H9.74432L6.64205 15ZM6.71591 10.4375H12.8523V12.1307H6.71591V10.4375Z"
        fill="white"
      />
    </svg>
  );
}

export { MoonshotAttackStrategyIcon };
