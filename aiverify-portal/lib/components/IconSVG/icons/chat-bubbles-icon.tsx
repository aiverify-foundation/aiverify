/*
  TODO - find another svg
*/

type ChatBubblesIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function ChatBubblesIcon(props: ChatBubblesIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      className={className}
      stroke="none"
      fill={color}
    >
      <g>
        <path d="M24 22a1 1 0 0 1-.64-.23L18.84 18H17a8 8 0 0 1 0-16h6a8 8 0 0 1 2 15.74V21a1 1 0 0 1-.58.91A1 1 0 0 1 24 22ZM17 4a6 6 0 0 0 0 12h2.2a1 1 0 0 1 .64.23L23 18.86v-1.94a1 1 0 0 1 .86-1A6 6 0 0 0 23 4Z" />
        <path d="M19 9h2v2h-2zM14 9h2v2h-2zM24 9h2v2h-2zM8 30a1 1 0 0 1-.42-.09A1 1 0 0 1 7 29v-3.26a8 8 0 0 1-1.28-15 1 1 0 1 1 .82 1.82 6 6 0 0 0 1.6 11.4 1 1 0 0 1 .86 1v1.94l3.16-2.63a1 1 0 0 1 .64-.27H15a5.94 5.94 0 0 0 4.29-1.82 1 1 0 0 1 1.44 1.4A8 8 0 0 1 15 26h-1.84l-4.52 3.77A1 1 0 0 1 8 30Z" />
      </g>
    </svg>
  );
}

export { ChatBubblesIcon };
