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

function InfoIcon({
  size = 20,
  color = '#FFFFFF',
  role,
  ariaLabel,
  disabled = false,
  className,
  style,
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -6 396 396" // Original viewBox
      width={size}
      height={size}
      fill={color} // Use fill for the info icon
      className={className}
      style={style}
      role={role}
      aria-label={ariaLabel}
      {...(disabled ? { 'aria-disabled': true } : {})}>
      <title>info</title>
      <path d="M198 342q-40.5 0 -75 -20.25t-54.75 -54.75 -20.25 -75 20.25 -75 54.75 -54.75 75 -20.25 75 20.25 54.75 54.75 20.25 75 -20.25 75 -54.75 54.75 -75 20.25m24 -186v-48h-48v48zm0 120V180h-48v96z" />
    </svg>
  );
}

export { InfoIcon };
