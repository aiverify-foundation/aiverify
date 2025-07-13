import * as React from 'react';
import { createContext, useContext, useRef, useState } from 'react';
import styles from './fileSelect.module.css';

// Types
type FileSelectContextType = {
  files: File[];
  handleFiles: (files: FileList | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  disabled: boolean;
  multiple?: boolean;
  accept?: string;
};

type FileSelectProps = {
  onFilesSelected?: (files: File[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

// Context
const FileSelectContext = createContext<FileSelectContextType | null>(null);

// Hook
function useFileSelect() {
  const context = useContext(FileSelectContext);
  if (!context) {
    throw new Error('useFileSelect must be used within FileSelect');
  }
  return context;
}

// Main Component
function FileSelect({
  onFilesSelected,
  children,
  multiple = false,
  accept,
  disabled = false,
  ...props
}: FileSelectProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    setFiles(newFiles);
    onFilesSelected?.(newFiles);
  };

  const value: FileSelectContextType = {
    files,
    handleFiles,
    inputRef,
    isDragging,
    setIsDragging,
    multiple,
    accept,
    disabled,
  };

  return (
    <FileSelectContext.Provider value={value}>
      <div {...props}>{children}</div>
    </FileSelectContext.Provider>
  );
}

// Hidden Input Component
function Input({ accept, multiple }: { accept?: string; multiple?: boolean }) {
  const { inputRef, handleFiles } = useFileSelect();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Clear the input value to allow selecting the same files again
    e.target.value = '';
  };

  return (
    <input
      ref={inputRef}
      type="file"
      className={styles.hiddenInput}
      onChange={handleChange}
      accept={accept}
      multiple={multiple}
    />
  );
}

// DropZone Component
type DropZoneProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function DropZone({ children, className, style }: DropZoneProps) {
  const { inputRef, setIsDragging, handleFiles, disabled } = useFileSelect();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={`${styles.dropZone} ${className} ${disabled ? styles.disabled : ''}`}
      style={style}
      onClick={!disabled ? handleClick : undefined}
      onDragOver={!disabled ? handleDragOver : undefined}
      onDragLeave={!disabled ? handleDragLeave : undefined}
      onDrop={!disabled ? handleDrop : undefined}>
      {children}
    </div>
  );
}

// Attach compound components
FileSelect.Input = Input;
FileSelect.DropZone = DropZone;

export { FileSelect };
