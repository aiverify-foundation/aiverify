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

function UploadIcon({ size = 50, color = '#FFFFFF' }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={color}
      viewBox="-3.75 -3.75 18 18">
      <path d="M6 2.561v4.232a0.75 0.75 0 1 1 -1.5 0V2.561L3.659 3.402A0.75 0.75 0 0 1 2.598 2.34L4.72 0.22a0.75 0.75 0 0 1 1.06 0l2.122 2.121A0.75 0.75 0 1 1 6.84 3.402zM0.75 9h9a0.75 0.75 0 0 1 0 1.5H0.75a0.75 0.75 0 0 1 0 -1.5" />
    </svg>
  );
}

export { UploadIcon };
