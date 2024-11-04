type PencilIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function PencilIcon(props: PencilIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 13"
      fill="none"
      stroke={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.01929 5.55022L6.9498 3.48072M1 11.5L2.75098 11.3054C2.96491 11.2817 3.07187 11.2698 3.17185 11.2374C3.26055 11.2087 3.34496 11.1681 3.4228 11.1168C3.51053 11.059 3.58663 10.9829 3.73883 10.8307L10.5714 3.9981C11.1429 3.42662 11.1429 2.50008 10.5714 1.92861C9.99993 1.35713 9.07339 1.35713 8.50192 1.9286L1.66934 8.76117C1.51714 8.91337 1.44104 8.98947 1.38319 9.0772C1.33186 9.15504 1.29129 9.23945 1.26257 9.32815C1.23021 9.42813 1.21832 9.53509 1.19455 9.74902L1 11.5Z"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { PencilIcon };
