'use client';

import { useState } from 'react';
import styles from './styles/toggleSwitch.module.css';

interface ToggleSwitchProps {
  name?: string;
  label?: string;
  value?: string;
  defaultChecked?: boolean;
  onChange?: (isChecked: boolean) => void;
}

function ToggleSwitch(props: ToggleSwitchProps) {
  const { name, label, value, defaultChecked = false, onChange } = props;
  const [isChecked, setIsChecked] = useState(defaultChecked);

  function toggle() {
    const newState = !isChecked;
    setIsChecked(newState);
    if (onChange) {
      onChange(newState);
    }
  }

  return (
    <label className={styles.toggleSwitch}>
      <div role="toggle-switch" className={styles.toggleSwitchContainer} onClick={toggle}>
        <div
          className={`${styles.toggleSwitchBackground} ${isChecked ? styles.toggleSwitchBackgroundChecked : ''}`}
        />
        <div
          className={`${styles.toggleSwitchKnob} ${isChecked ? styles.toggleSwitchKnobChecked : ''}`}
        />
      </div>
      {label && <div className={styles.toggleSwitchLabel}>{label}</div>}
      <input
        readOnly
        type="checkbox"
        defaultChecked={isChecked}
        defaultValue={value}
        name={name}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
    </label>
  );
}

export { ToggleSwitch };
