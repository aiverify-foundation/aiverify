import React from 'react';

type IconProps = {
  size?: number;
  color?: string;
  role?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
};

function DeleteIcon({
  size = 20,
  color = '#ffffff',
  role = 'button',
  ariaLabel,
  disabled = false,
  className,
  style,
  onClick,
  onMouseDown,
}: IconProps) {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={role}
      tabIndex={0} // Makes the icon focusable for keyboard navigation
      style={{
        ...style,
        cursor: disabled ? 'not-allowed' : 'pointer', // Change cursor style when disabled
        opacity: disabled ? 0.5 : 1, // Dim the icon when disabled
      }}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      onMouseDown={onMouseDown}
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