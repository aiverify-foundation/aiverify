type MoonshotPromptTemplateIconProps = {
  width: number;
  height: number;
  color?: string;
  className?: string;
};

function MoonshotPromptTemplateIcon(props: MoonshotPromptTemplateIconProps) {
  const { color, width, height, className } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 18"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1.8 0H16.2C17.19 0 18 0.81 18 1.8V12.6C18 13.59 17.19 14.4 16.2 14.4H3.6L0 18V1.8C0 0.81 0.81 0 1.8 0Z" />
    </svg>
  );
}

export { MoonshotPromptTemplateIcon };
