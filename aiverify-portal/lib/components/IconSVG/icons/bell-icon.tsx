type BellIconProps = {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
};

function BellIcon(props: BellIconProps) {
  const { width, height, className, color } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 37 40"
      stroke="none"
      fill={color}
      className={className}
    >
      <path d="M14.016 3.43405C14.6733 1.43964 16.5515 0 18.766 0C20.9805 0 22.8587 1.43964 23.516 3.43405C28.0637 5.30377 31.2659 9.77789 31.2659 14.9999V24.9998L36.6319 30.3658C37.4194 31.1533 36.8616 32.4998 35.7479 32.4998H1.78376C0.670138 32.4998 0.112417 31.1533 0.899862 30.3658L6.26608 24.9998V14.9999C6.26608 9.77789 9.46826 5.30377 14.016 3.43405Z" />
      <path d="M13.766 35C13.766 37.7615 16.0045 40 18.766 40C21.5275 40 23.766 37.7615 23.766 35H13.766Z" />
    </svg>
  );
}

export { BellIcon };
