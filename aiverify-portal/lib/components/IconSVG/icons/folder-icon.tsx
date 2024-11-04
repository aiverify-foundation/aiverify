/*
  License: Creative Commons (Attribution 3.0 Unported)
  License URL: https://creativecommons.org/licenses/by/3.0/
  Source: https://www.iconfinder.com/iconsets/small-n-flat
  Credit: https://www.iconfinder.com/paomedia
  Changes Made: 
    - Wrapped in React component
    - Make colors and size configurable using props 
    - Removed XML namespaces
*/

type FolderIconProps = {
  backColor: string;
  frontColor: string;
  midColor: string;
  width?: number;
  height?: number;
  className?: string;
};

function FolderIcon(props: FolderIconProps) {
  const { backColor, frontColor, midColor, width, height, className } = props;
  return (
    <svg version="1.1" height={height} width={width} viewBox="0 0 24 24" className={className}>
      <g transform="translate(0 -1028.4)">
        <path
          d="m2 1033.4c-1.1046 0-2 0.9-2 2v14c0 1.1 0.89543 2 2 2h20c1.105 0 2-0.9 2-2v-14c0-1.1-0.895-2-2-2h-20z"
          fill={backColor}
        />
        <path
          d="m3 1029.4c-1.1046 0-2 0.9-2 2v14c0 1.1 0.8954 2 2 2h11 5 2c1.105 0 2-0.9 2-2v-9-3c0-1.1-0.895-2-2-2h-2-5-1l-3-2h-7z"
          fill={backColor}
        />
        <path
          d="m23 1042.4v-8c0-1.1-0.895-2-2-2h-11-5-2c-1.1046 0-2 0.9-2 2v8h22z"
          fill={midColor}
        />
        <path
          d="m2 1033.4c-1.1046 0-2 0.9-2 2v6 1 6c0 1.1 0.89543 2 2 2h20c1.105 0 2-0.9 2-2v-6-1-6c0-1.1-0.895-2-2-2h-20z"
          fill={frontColor}
        />
      </g>
    </svg>
  );
}

export { FolderIcon };
