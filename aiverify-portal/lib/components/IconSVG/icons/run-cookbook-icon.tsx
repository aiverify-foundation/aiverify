/*
  TODO - find another svg
*/

type RunCookbookIconIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function RunCookbookIcon(props: RunCookbookIconIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg width={width} height={height} viewBox="0 0 32 32" fill={color} stroke="none" className={className}>
      <g transform="scale(0.90)">
        <path
          d="M32 23.001c0-3.917-2.506-7.24-5.998-8.477V4h-2V1.999h2V0h-23c-.084.004-.708-.008-1.446.354C.808.686-.034 1.645.001 3l.001.018V30c0 2 2 2 2 2h21.081l-.007-.004c4.937-.041 8.924-4.05 8.924-8.995zM2.853 3.981c-.178-.026-.435-.112-.579-.238-.138-.134-.257-.243-.272-.743.033-.646.194-.686.447-.856.13-.065.289-.107.404-.125.117-.022.147-.014.149-.02h19V4h-19c-.002 0-.032.002-.149-.019zM4 30V6h20v8.06a8.956 8.956 0 0 0-1.002-.06 8.956 8.956 0 0 0-5.651 2H6v2h9.516a8.955 8.955 0 0 0-.995 2H6v2h8.057a8.975 8.975 0 0 0 3.289 8H4zm19 0a7.01 7.01 0 0 1-7-6.999 7.008 7.008 0 0 1 7-7 7.01 7.01 0 0 1 7 7A7.011 7.011 0 0 1 23 30zm-1-18H6v2h16v-2z"
        />
        <path d="M22 19v8l4-4z" />
      </g>
    </svg>
  );
}

export { RunCookbookIcon };
