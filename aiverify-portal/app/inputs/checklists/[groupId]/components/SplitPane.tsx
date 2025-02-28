import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div className="flex h-full w-full flex-1">
      {/* Left pane adjusted for better fit */}
      <div className="flex-1 basis-1/4 p-4">{leftPane}</div>
      {/* Right pane adjusted for proper alignment */}
      <div className="flex-1 basis-3/4 overflow-y-auto p-3">{rightPane}</div>
    </div>
  );
}
