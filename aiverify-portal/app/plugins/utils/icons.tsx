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
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeWidth="1.5"
      stroke={color}
      className={className}
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      onMouseDown={disabled ? undefined : onMouseDown}
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}>
      <path
        fill={color}
        stroke="none"
        d="M22,5.18L10.59,16.6l-4.24-4.24l1.41-1.41l2.83,2.83l10-10L22,5.18z M19.79,10.22C19.92,10.79,20,11.39,20,12 c0,4.42-3.58,8-8,8s-8-3.58-8-8c0-4.42,3.58-8,8-8c1.58,0,3.04,0.46,4.28,1.25l1.44-1.44C16.1,2.67,14.13,2,12,2C6.48,2,2,6.48,2,12 c0,5.52,4.48,10,10,10s10-4.48,10-10c0-1.19-0.22-2.33-0.6-3.39L19.79,10.22z"
      />
    </svg>
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
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onMouseDown={disabled ? undefined : onMouseDown}>
      <defs>
        <mask id="check-mask">
          <rect
            width="100%"
            height="100%"
            fill="white"
          />
          <path
            d="M9 12l2 2 4-4"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={color}
        mask="url(#check-mask)"
      />
    </svg>
  );
}

function CrossCircleIcon({
  size = 20,
  color = '#ffffff',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
  onClick,
  onMouseDown,
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      onMouseDown={disabled ? undefined : onMouseDown}>
      <defs>
        <mask id="cut-out-x">
          <rect
            width="100%"
            height="100%"
            fill="white"
          />
          <line
            x1="8"
            y1="8"
            x2="16"
            y2="16"
            stroke="black"
            stroke-width="2"
          />
          <line
            x1="16"
            y1="8"
            x2="8"
            y2="16"
            stroke="black"
            stroke-width="2"
          />
        </mask>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={color}
        mask="url(#cut-out-x)"
      />
    </svg>
  );
}

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
      onMouseDown={onMouseDown}>
      <path d="M3 6h18" /> {/* Top line of the trash can */}
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> {/* Trash can lid */}
      <rect
        x="5"
        y="6"
        width="14"
        height="14"
        rx="2"
      />{' '}
      {/* Trash can body */}
      <line
        x1="10"
        y1="11"
        x2="10"
        y2="17"
      />{' '}
      {/* Left trash line */}
      <line
        x1="14"
        y1="11"
        x2="14"
        y2="17"
      />{' '}
      {/* Right trash line */}
    </svg>
  );
}

export { TaskAltIcon, CheckCircleIcon, CrossCircleIcon, DeleteIcon };
