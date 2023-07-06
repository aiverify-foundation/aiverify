import styles from '../styles/notificationCard.module.css';
import { SpecializedCardProps } from '.';
import { AssetStatusNotification, AssetType } from '../types';
import { AssetValidationStatus } from 'src/types/dataset.interface';

function AssetStatusCard(props: SpecializedCardProps<AssetStatusNotification>) {
  const { notification, showMsgBody = false } = props;
  const { title, subject, body, assetType, assetStatus, assetName } =
    notification;

  let subjectText = subject;
  let assetTypeText: string;

  if (assetType === AssetType.DATASET) {
    assetTypeText = 'Dataset';
  } else if (assetType === AssetType.MODEL) {
    assetTypeText = 'Model';
  } else {
    assetTypeText = 'Unknown asset type';
  }

  const titleText =
    title.trim() !== '' ? title : `${assetTypeText} Upload Status`;

  switch (assetStatus) {
    case AssetValidationStatus.Valid:
      subjectText = `${assetTypeText} is valid`;
      break;
    case AssetValidationStatus.Invalid:
      subjectText = `${assetTypeText} is invalid`;
      break;
    case AssetValidationStatus.Pending:
      subjectText = `${assetTypeText} validation is pending`;
      break;
    case AssetValidationStatus.Error:
      subjectText = `Error encountered while validatin ${assetTypeText}`;
      break;
    case AssetValidationStatus.Cancelled:
      subjectText = `${assetTypeText} validation cancelled`;
      break;
    default:
      subjectText = `${assetTypeText} validation status unknown`;
      break;
  }

  return (
    <div>
      <h4>{titleText}</h4>
      <div className={styles.subject}>{subjectText}</div>
      {showMsgBody ? <div className={styles.body}>{body}</div> : null}
      <div className={styles.callToAction}>
        {!showMsgBody ? (
          <div className={styles.assetName}>Filename: {assetName}</div>
        ) : null}
      </div>
    </div>
  );
}

export { AssetStatusCard };
