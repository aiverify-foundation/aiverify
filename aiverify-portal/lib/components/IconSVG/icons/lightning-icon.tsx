type LightningIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function LightningIcon(props: LightningIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 45 52"
      fill={color}
      stroke="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24.5812 1L2.31484 27.7196C1.44282 28.7661 1.00681 29.2893 1.00014 29.7312C0.99435 30.1153 1.16553 30.4808 1.46434 30.7222C1.80807 31 2.48914 31 3.85128 31H22.0812L19.5812 51L41.8476 24.2804C42.7196 23.2339 43.1556 22.7107 43.1623 22.2688C43.168 21.8847 42.9969 21.5192 42.6981 21.2778C42.3543 21 41.6733 21 40.3111 21H22.0812L24.5812 1Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { LightningIcon };
