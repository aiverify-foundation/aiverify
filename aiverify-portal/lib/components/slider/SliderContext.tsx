import React, { createContext, useContext } from 'react';

type SliderContextType = {
  min: number;
  max: number;
  step: number;
  value: number;
  trackColor?: string;
  handleColor?: string;
  progressColor?: string;
  trackWidth: React.CSSProperties['width'];
  trackHeight: React.CSSProperties['height'];
  handleClassName?: string;
  onChange: (value: number) => void;
};

const SliderContext = createContext<SliderContextType | undefined>(undefined);

export function SliderProvider({
  value,
  children,
}: {
  value: SliderContextType;
  children: React.ReactNode;
}) {
  return <SliderContext.Provider value={value}>{children}</SliderContext.Provider>;
}

export function useSliderContext() {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('useSliderContext must be used within a SliderProvider');
  }
  return context;
}
