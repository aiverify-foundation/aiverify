import clsx from 'clsx';
import React, { useState, useCallback } from 'react';
import { SliderProvider } from './SliderContext';
import { SliderHandle } from './SliderHandle';
import { SliderProgressTrack } from './SliderProgressTrack';
import { SliderTrack } from './SliderTrack';
import { SliderValue } from './SliderValue';
import styles from './styles/Slider.module.css';

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  trackColor?: string;
  handleColor?: string;
  progressColor?: string;
  trackWidth?: React.CSSProperties['width'];
  trackHeight?: React.CSSProperties['height'];
  children?: React.ReactNode;
  className?: string;
  onChange?: (value: number) => void;
}

export function Slider(props: SliderProps) {
  const {
    min = 0,
    max = 100,
    step = 1,
    defaultValue = min,
    trackColor,
    handleColor,
    progressColor,
    trackWidth = '100%',
    trackHeight = 4,
    children,
    className,
    onChange,
  } = props;
  const [value, setValue] = useState(defaultValue);
  const handleChange = useCallback(
    (newValue: number) => {
      setValue(Math.min(max, Math.max(min, newValue)));
      onChange?.(newValue);
    },
    [min, max, onChange]
  );
  const classNames = clsx(styles.slider, className);
  return (
    <SliderProvider
      value={{
        min,
        max,
        step,
        value,
        trackColor,
        handleColor,
        progressColor,
        trackWidth,
        trackHeight,
        onChange: handleChange,
      }}>
      <div
        className={classNames}
        style={{ width: trackWidth }}>
        {children}
      </div>
    </SliderProvider>
  );
}

Slider.Track = SliderTrack;
Slider.Handle = SliderHandle;
Slider.Value = SliderValue;
Slider.ProgressTrack = SliderProgressTrack;
