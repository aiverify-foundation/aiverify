type DeleteIconProps = {
    width: number;
    height: number;
    color?: string;
    className?: string;
  };
  
  function DeleteIcon(props: DeleteIconProps) {
    const { width, height, color = "currentColor", className } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        className={className}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" /> {/* Top line of the trash can */}
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> {/* Trash can lid */}
        <rect x="5" y="6" width="14" height="14" rx="2" /> {/* Trash can body */}
        <line x1="10" y1="11" x2="10" y2="17" /> {/* Left trash line */}
        <line x1="14" y1="11" x2="14" y2="17" /> {/* Right trash line */}
      </svg>
    );
  }
  
  export { DeleteIcon };
  