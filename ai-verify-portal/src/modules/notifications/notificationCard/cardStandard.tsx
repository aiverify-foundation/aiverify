import styles from '../styles/notificationCard.module.css';
import { SpecializedCardProps } from '.';

function CardStandard(props: SpecializedCardProps) {
  const { notification, showMsgBody = false } = props;
  const { title, subject, body } = notification;

  const subjectText = subject || 'No Subject';

  return (
    <div>
      <h4>{title}</h4>
      <div className={styles.subject}>{subjectText}</div>
      {showMsgBody ? <div className={styles.body}>{body}</div> : null}
    </div>
  );
}

export { CardStandard };
