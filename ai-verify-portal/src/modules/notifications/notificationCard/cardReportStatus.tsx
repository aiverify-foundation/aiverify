import styles from '../styles/notificationCard.module.css';
import { ProjectReportStatus } from 'src/types/project.interface';
import React from 'react';
import { Icon } from 'src/components/icon';
import { IconName } from 'src/components/icon/iconNames';
import { SpecializedCardProps } from '.';
import { ReportStatusNotification } from '../types';

function CardReportStatus(props: SpecializedCardProps<ReportStatusNotification>) {
  const { notification, showMsgBody = false } = props;
  const {
    subject,
    body,
    projectId,
    projectName,
    reportStatus,
  } = notification;

  let SubjectDisplay: React.FC = () => <div>{subject || 'No Subject'}</div>;
  let CallToAction: React.FC = () => null;
  let titleText: string;

  function handleViewReportClick(projectId: string | undefined) {
		return (e: React.MouseEvent) => {
      e.stopPropagation();
			if (!projectId) {
				console.error('projectId is undefined');
				return;
			}
			window.open(`/api/report/${projectId}`, '_blank');
		}
	}

  switch (reportStatus) {
    case ProjectReportStatus.ReportGenerated:
      titleText = 'Report Generated';
      SubjectDisplay = function Comp() {
        return !projectName ? <div>Report is ready.</div> :
          <div>Report from <span style={{ fontWeight: 600 }}>{projectName}</span> is ready</div>;
      };
      CallToAction = function Comp() {
        if (projectId == undefined) return null;
        return <div className={styles.viewReportCTA}
          onClick={handleViewReportClick(projectId)}>
            <Icon name={IconName.PDF} size={30} style={{ cursor: 'pointer' }}/>
            <div className={styles.ctaText}>View Report</div>
          </div>
      };
      break;

    default:
      titleText = 'Report Status'
      SubjectDisplay = function Comp() {
        return <div>Report generation has an unknown update.</div>;
      };
      CallToAction = function Comp() { return null };
      break;
  }

  return <div>
      <h4>{titleText}</h4>
      <div className={styles.subject}>
        <SubjectDisplay />
      </div>
      { showMsgBody ? <div className={styles.body}>
        {body}
      </div> : null }
      <div className={styles.callToAction}>
        <CallToAction />
      </div>
    </div>
}

export { CardReportStatus };