import React from 'react';

type SplitPaneProps = {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
};

export default function SplitPane({ leftPane, rightPane }: SplitPaneProps) {
  return (
    <div className="flex h-[calc(100vh-150px)]">
      <div className="w-2/5 max-h-full">
        {leftPane}
      </div>
      <div className="w-3/5 y-auto p-5">
        {rightPane}
      </div>
    </div>
  );
}
