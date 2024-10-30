import { useRef, useEffect } from 'react';
import { useSliderContext } from './SliderContext';
import styles from './styles/Slider.module.css';
import clsx from 'clsx';

type SliderHandleProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function SliderHandle({ children, className, style }: SliderHandleProps) {
  const { min, max, step, value, onChange, handleColor } = useSliderContext();
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startValue = value;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!handle.parentElement) {
          console.error('Slider handle parent element not found');
          return;
        }
        const dx = moveEvent.clientX - startX;
        const range = max - min;
        const newValue = startValue + (dx / handle.parentElement.clientWidth) * range;
        const steppedValue = Math.round((newValue - min) / step) * step + min;
        onChange(Math.min(max, Math.max(min, steppedValue)));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [min, max, step, value, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={handleRef}
      className={clsx(styles.handle, className)}
      style={{
        left: `${percentage}%`,
        backgroundColor: handleColor,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
