import React from 'react';

type IconProps = {
  size?: number;
  color?: string;
  role?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
};

function TaskAltIcon({
  size = 20,
  color = '#000000',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
  onClick,
  onMouseDown,
}: IconProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onClick={handleClick}
      onMouseDown={disabled ? undefined : onMouseDown}
      className={className}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size} strokeWidth="1.5" stroke={color} className={className}>
        <path 
            fill={color}
            stroke='none'
            d="M22,5.18L10.59,16.6l-4.24-4.24l1.41-1.41l2.83,2.83l10-10L22,5.18z M19.79,10.22C19.92,10.79,20,11.39,20,12 c0,4.42-3.58,8-8,8s-8-3.58-8-8c0-4.42,3.58-8,8-8c1.58,0,3.04,0.46,4.28,1.25l1.44-1.44C16.1,2.67,14.13,2,12,2C6.48,2,2,6.48,2,12 c0,5.52,4.48,10,10,10s10-4.48,10-10c0-1.19-0.22-2.33-0.6-3.39L19.79,10.22z"
        />
        </svg>
    </div>
  );
}


function CheckCircleIcon({
  size = 20,
  color = '#000000',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
  onClick,
  onMouseDown,
}: IconProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onClick={handleClick}
      onMouseDown={disabled ? undefined : onMouseDown}
      className={className}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
      >
        <mask id="check-mask">
          <circle cx="12" cy="12" r="10" fill={color} />
          <path
            d="M9 12l2 2 4-4"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
        <circle cx="12" cy="12" r="10" fill={color} mask="url(#check-mask)" />
      </svg>
    </div>
  );
}

export { TaskAltIcon, CheckCircleIcon };

