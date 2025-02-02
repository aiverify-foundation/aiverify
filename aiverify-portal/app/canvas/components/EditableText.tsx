import React, { useState, useCallback } from 'react';

type EditableTextProps = {
  children: React.ReactNode;
  onTextChange?: (newText: string) => void;
};

export function EditableText({ children, onTextChange }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      setIsEditing(false);
      onTextChange?.(e.target.textContent || '');
    },
    [onTextChange]
  );

  if (typeof children !== 'string') {
    return children;
  }

  return (
    <span
      contentEditable={true}
      suppressContentEditableWarning
      className="hover:bg-black/5 focus:bg-black/10 relative cursor-text rounded p-0.5 transition-colors duration-200 ease-in-out focus:outline-none"
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}>
      {children}
    </span>
  );
}
