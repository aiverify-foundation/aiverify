import clsx from 'clsx';
import styles from './styles/simpleStepsIndicator.module.css';

type SimpleStepsIndicator = {
  textColor?: string;
  stepColor?: string;
  steps: string[];
  currentStepIndex: number;
};

function SimpleStepsIndicator({
  steps,
  textColor = '#FFFFFF',
  currentStepIndex,
  stepColor = '#d5aaea',
}: SimpleStepsIndicator) {
  return (
    <header className={styles.stepsIndicator}>
      {steps.map((step, index) => (
        <div
          key={step}
          className={clsx(
            styles.step,
            currentStepIndex === index ? styles.active : '',
            currentStepIndex > index ? styles.done : ''
          )}
          style={{
            borderColor: stepColor,
          }}>
          <div
            className={styles.colorBar}
            style={{
              backgroundColor: stepColor,
            }}
          />
          <span style={{ color: textColor }}>{step}</span>
        </div>
      ))}
    </header>
  );
}

export default SimpleStepsIndicator;
