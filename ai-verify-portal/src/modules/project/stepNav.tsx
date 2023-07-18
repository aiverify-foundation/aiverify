import React from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './styles/project.module.css';

type StepNavProps = {
  onNextClick: () => void;
  onBackClick: () => void;
};

function ProjectStepNav(props: StepNavProps) {
  const { onNextClick, onBackClick } = props;
  return (
    <div className={styles.stepNavBtnGroup}>
      <div onClick={onBackClick} className={styles.stepNavBtn}>
        <ArrowBackIcon />
      </div>
      <div className={styles.stepInfo}></div>
      <div onClick={onNextClick} className={styles.stepNavBtn}>
        <ArrowForwardIcon />
      </div>
    </div>
  );
}

export { ProjectStepNav };
