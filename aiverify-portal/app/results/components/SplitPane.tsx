import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div className="flex h-[calc(100vh-150px)]">
      <div className="relative max-h-full w-2/5 overflow-hidden">
        <div className="h-full overflow-auto">{leftPane}</div>
      </div>
      <div className="w-3/5 overflow-y-auto p-5">{rightPane}</div>
    </div>
  );
}
