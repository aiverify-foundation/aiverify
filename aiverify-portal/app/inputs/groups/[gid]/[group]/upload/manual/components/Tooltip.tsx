import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute left-1/2 top-full mt-1 w-max -translate-x-1/2 rounded bg-gray-800 px-3 py-2 text-sm text-white shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};
