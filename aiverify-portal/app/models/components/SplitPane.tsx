import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div className="flex h-[calc(100vh-150px)]">
      {/* Left pane adjusted for better fit */}
      <div className="flex-shrink-0 flex-grow basis-3/5 p-2">
        {leftPane}
      </div>
      {/* Right pane adjusted for proper alignment */}
      <div className="basis-2/5 overflow-y-auto p-2">
        {rightPane}
      </div>
    </div>
  );
}