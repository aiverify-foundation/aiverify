import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div className="flex w-full h-full">
      {/* Left pane adjusted for better fit */}
      <div className="basis-1/4 p-2">{leftPane}</div>
      {/* Right pane adjusted for proper alignment */}
      <div className="basis-3/4 overflow-y-auto p-3">{rightPane}</div>
    </div>
  );
}
