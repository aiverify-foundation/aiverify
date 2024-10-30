import clsx from 'clsx';
import { useSliderContext } from './SliderContext';
import styles from './styles/Slider.module.css';

type SliderValueProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function SliderValue({ className, style }: SliderValueProps) {
  const { value } = useSliderContext();
  return (
    <div className={clsx(styles.value, className)} style={style}>
      {value}
    </div>
  );
}
