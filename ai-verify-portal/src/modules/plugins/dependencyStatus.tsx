import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import styles from './styles/plugins.module.css';
import { deserializeAlgoRequirement } from './utils/deserializeAlgoRequirement';

type DependencyStatus = {
  requirement: string;
  isValid: boolean;
};

function DependencyStatus(props: DependencyStatus) {
  const { requirement, isValid } = props;

  const parts = deserializeAlgoRequirement(requirement);

  return parts === undefined ? null : (
    <div className={styles.valueDisplay}>
      <div className={styles.statusIcon}>
        {isValid ? (
          <TaskAltIcon style={{ color: '#52be52', fontSize: '16px' }} />
        ) : (
          <ErrorOutlineIcon style={{ color: '#f73939', fontSize: '16px' }} />
        )}
      </div>
      <div className={styles.label}>
        {parts[0]} {parts[1]}
        {parts[2]}
      </div>
    </div>
  );
}

export { DependencyStatus };
