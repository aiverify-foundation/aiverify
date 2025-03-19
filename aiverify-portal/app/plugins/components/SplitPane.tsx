import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div
      className="flex h-[calc(100vh-150px)]"
      role="region"
      aria-label="Split pane container">
      {/* Left pane adjusted for better fit */}
      <div
        className="flex-shrink-0 flex-grow basis-2/5 p-2"
        role="region"
        aria-label="Left pane content">
        {leftPane}
      </div>
      {/* Right pane adjusted for proper alignment */}
      <div
        className="flex-shrink-0 flex-grow basis-3/5 overflow-y-auto p-3"
        role="region"
        aria-label="Right pane content">
        {rightPane}
      </div>
    </div>
  );
}
