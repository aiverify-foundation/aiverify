/*
  License: Creative Commons (Attribution 3.0 Unported)
  License URL: https://creativecommons.org/licenses/by/3.0/
  Source: https://www.iconfinder.com/iconsets/small-n-flat
  Credit: https://www.iconfinder.com/paomedia
  Changes Made: 
    - Wrapped in React component
    - Make colors and size configurable using props 
    - Add chat
    - Removed XML namespaces
*/

type FolderIconProps = {
  backColor: string;
  frontColor: string;
  midColor: string;
  chatIconColor: string;
  width?: number;
  height?: number;
};

function FolderForChatSessionsIcon({
  backColor = '#2980b9',
  frontColor = '#3498db',
  midColor = '#bdc3c7',
  chatIconColor = '#2980b9',
  width = 50,
  height = 50,
}: FolderIconProps) {
  return (
    <svg version="1.1" height={height} width={width} viewBox="0 0 24 24">
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
      <g transform="scale(0.45) translate(10, 15)">
        <path
          d="M24 22a1 1 0 0 1-.64-.23L18.84 18H17a8 8 0 0 1 0-16h6a8 8 0 0 1 2 15.74V21a1 1 0 0 1-.58.91A1 1 0 0 1 24 22ZM17 4a6 6 0 0 0 0 12h2.2a1 1 0 0 1 .64.23L23 18.86v-1.94a1 1 0 0 1 .86-1A6 6 0 0 0 23 4Z"
          fill={chatIconColor}
        />
        <path
          d="M19 9h2v2h-2zM14 9h2v2h-2zM24 9h2v2h-2zM8 30a1 1 0 0 1-.42-.09A1 1 0 0 1 7 29v-3.26a8 8 0 0 1-1.28-15 1 1 0 1 1 .82 1.82 6 6 0 0 0 1.6 11.4 1 1 0 0 1 .86 1v1.94l3.16-2.63a1 1 0 0 1 .64-.27H15a5.94 5.94 0 0 0 4.29-1.82 1 1 0 0 1 1.44 1.4A8 8 0 0 1 15 26h-1.84l-4.52 3.77A1 1 0 0 1 8 30Z"
          fill={chatIconColor}
        />
      </g>
    </svg>
  );
}

export { FolderForChatSessionsIcon };
