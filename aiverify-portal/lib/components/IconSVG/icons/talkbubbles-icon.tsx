type TalkBubblesIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function TalkBubblesIcon(props: TalkBubblesIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 54 47"
      fill="none"
      stroke={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M38.1111 12.6667H49.2222C50.7564 12.6667 52 13.8606 52 15.3333V44.6667L42.7417 37.2827C42.243 36.8848 41.6133 36.6667 40.9647 36.6667H18.6667C17.1325 36.6667 15.8889 35.4728 15.8889 34V26M38.1111 12.6667V4.66667C38.1111 3.19392 36.8675 2 35.3333 2H4.77778C3.24367 2 2 3.19392 2 4.66667V34.0008L11.2584 26.6155C11.7571 26.2179 12.3868 26 13.0352 26H15.8889M38.1111 12.6667V23.3333C38.1111 24.8061 36.8675 26 35.3333 26H15.8889"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { TalkBubblesIcon };
