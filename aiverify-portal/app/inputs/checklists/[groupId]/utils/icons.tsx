import React from 'react';

type IconProps = {
  size?: number;
  color?: string;
  role?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function CheckCircleIcon({
  size = 20,
  color = '#000000',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
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
      }}>
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

function WarningCircleIcon({
  size = 20,
  color = '#000000',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24" // Ensure this matches CheckCircleIcon
      width={size}
      height={size}
      className={className}
      role={role}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        ...style,
      }}>
      <circle
        cx="12"
        cy="12"
        r="10" // Ensure consistent scaling of the circle
        fill={color}
      />
      <path
        d="M12 6v6m0 4h.01" // Adjusted path to align visually
        fill="none"
        stroke="white" // Inner stroke for warning symbol
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { CheckCircleIcon, WarningCircleIcon };
