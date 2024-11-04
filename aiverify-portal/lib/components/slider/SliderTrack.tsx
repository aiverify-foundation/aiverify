import clsx from 'clsx';
import { useSliderContext } from './SliderContext';
import styles from './styles/Slider.module.css';

export function SliderTrack(props: { className?: string }) {
  const { trackColor, trackWidth, trackHeight } = useSliderContext();
  return (
    <div
      className={clsx(styles.track, props.className)}
      style={{ backgroundColor: trackColor, width: trackWidth, height: trackHeight }}
    />
  );
}
