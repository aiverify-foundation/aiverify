import { useState, useEffect } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import { ProjectReportStatus, Report } from 'src/types/project.interface';
import { TestEngineTask, TestEngineTaskStatus } from 'src/types/test.interface';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { formatDate } from 'src/lib/utils';
import {
  useCancelTestRuns,
  useSubscribeTestTaskUpdated,
  useSubscribeReportStatusUpdated,
} from 'src/lib/projectService';
import styles from './styles/generateReport.module.css';
import { getTestLogs } from './api/logs';
import HttpStatusCode from 'src/types/httpStatusCode';
import { getReport } from './api/report';
import { Chip, CircularProgress } from '@mui/material';
import { Icon } from 'src/components/icon';
import { IconName } from 'src/components/icon/iconNames';

type TestRunStatusProps = {
  test: TestEngineTask;
  report: Report;
  logs: string;
  onCancel?: () => void;
};

type StatusBadgeColors =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

type StatusBadgeProps = {
  status: TestEngineTaskStatus;
  disableCancelBtn?: boolean;
  onCancelClick: () => void;
};

function StatusBadge({
  status,
  disableCancelBtn = false,
  onCancelClick,
}: StatusBadgeProps) {
  let statusText = '';
  let color: StatusBadgeColors = 'default';

  switch (status) {
    case TestEngineTaskStatus.Pending:
      statusText = 'Pending';
      color = 'secondary';
      return (
        <div>
          <button
            disabled={disableCancelBtn}
            className="aivBase-button aivBase-button--primary aivBase-button--small"
            onClick={onCancelClick}
            style={{ width: '70px' }}>
            Stop
          </button>
          <Chip
            icon={<CircularProgress color="secondary" size="18px" />}
            label={statusText}
            variant="outlined"
            color={color}
          />
        </div>
      );
    case TestEngineTaskStatus.Running:
      statusText = 'Running';
      color = 'secondary';
      return (
        <div>
          <button
            disabled={disableCancelBtn}
            className="aivBase-button aivBase-button--primary aivBase-button--small"
            onClick={onCancelClick}
            style={{ width: '70px' }}>
            Stop
          </button>
          <Chip
            icon={<CircularProgress color="secondary" size="18px" />}
            label={statusText}
            variant="outlined"
            color={color}
          />
        </div>
      );
    case TestEngineTaskStatus.Success:
      color = 'success';
      statusText = 'Test Completed';
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
    case TestEngineTaskStatus.Cancelled:
      color = 'error';
      statusText = 'Cancelled';
      return (
        <Chip
          icon={<ErrorIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
    case TestEngineTaskStatus.Error:
      color = 'error';
      statusText = 'Test Error';
      return (
        <Chip
          icon={<ErrorIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
  }
}

function TestRunStatus(props: TestRunStatusProps) {
  const { test, report, logs, onCancel } = props;
  const cancelTestRuns = useCancelTestRuns();
  const [disableStopButton, setDisableStopButton] = useState<boolean>(false);

  const logsWithLineBreaks =
    logs != undefined ? logs.replace(/(?:\r\n|\r|\n)/g, '<br>') : logs;

  async function handleStopTestClick() {
    setDisableStopButton(true);
    try {
      await cancelTestRuns(report.projectID, [test.algorithmGID]);
      if (onCancel) onCancel();
    } catch (e) {
      console.error('Cancel test run error:', e);
    }
    setDisableStopButton(false);
  }

  return (
    <div className={styles.testCard}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
        <h3 style={{ color: '#702F8A' }}>{test.algorithm.name}</h3>
        <StatusBadge
          onCancelClick={handleStopTestClick}
          status={test.status}
          disableCancelBtn={disableStopButton}
        />
      </div>
      <LinearProgress
        variant="determinate"
        value={test.progress}
        sx={{ width: '100%', mt: 2 }}
      />
      <Accordion
        sx={{
          width: '100%',
          mt: 2,
          bgcolor: 'transparent',
          border: 0,
          boxShadow: 0,
        }}
        disableGutters
        defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: 'transparent', p: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}>
            <div style={{ display: 'flex', fontSize: '14px' }}>
              <div>
                Time Started: {test.timeStart ? formatDate(test.timeStart) : ''}
              </div>
              {test.status === TestEngineTaskStatus.Success && (
                <div>, Time Taken: {test.timeTaken} seconds</div>
              )}
            </div>
            <div style={{ display: 'flex', fontSize: '14px' }}>
              <ArticleIcon sx={{ mr: 1 }} />
              Logs
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: 'transparent', p: 0 }}>
          <div
            className={styles.logsContainer}
            dangerouslySetInnerHTML={{ __html: logsWithLineBreaks }}
          />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

type Props = {
  report: Report;
};

type testTaskEventData = {
  testTaskUpdated: {
    algorithmGID: string;
    progress: number;
    status: TestEngineTaskStatus;
    timeStart: string;
    timeTaken: string;
  };
};

export default function GeneratingReportComponent({ report }: Props) {
  const [selectedReport, setSelectedReport] = useState<Report>(() => report);
  const [tests, setTests] = useState(() => report.tests || []);
  const [logsList, setLogsList] = useState<string[]>([]);
  const [updatedTest, _] = useSubscribeTestTaskUpdated(report.projectID);
  const [reportUpdate, __] = useSubscribeReportStatusUpdated(report.projectID);

  async function fetchTestLogs() {
    const result = await getTestLogs(selectedReport.projectID);
    if ('status' in result) {
      if (result.status === HttpStatusCode.OK) {
        if (!result.data.length) {
          setLogsList([]);
        }
        const logsInTestsOrder = tests.map((test) => {
          const testLogs = result.data.find(
            (logs) => logs.algoGID === test.algorithmGID
          );
          return !testLogs ? 'No Logs' : testLogs.logs;
        });
        setLogsList(logsInTestsOrder);
      }
    } else {
      console.log(result);
    }
  }

  async function fetchUpdatedReport() {
    const report = await getReport(selectedReport.projectID);
    if (report) setSelectedReport(report);
    if (report.tests) setTests([...report.tests]);
  }

  function getStatus() {
    switch (selectedReport.status) {
      case ProjectReportStatus.RunningTests:
        return 'Running Tests...';
      case ProjectReportStatus.GeneratingReport:
        return 'Generating Report...';
      case ProjectReportStatus.ReportGenerated:
        return 'Report Generated';
      default:
        return 'Invalid Status';
    }
  }

  function handleViewReportClick(id: string) {
    return () => {
      if (!id || typeof id !== 'string') {
        console.log('id is undefined or invalid');
        return;
      }
      window.open(`/api/report/${id}`, '_blank');
    };
  }

  useEffect(() => {
    if (!tests || !updatedTest || updatedTest.testTaskUpdated) return;

    try {
      const data = (updatedTest as testTaskEventData).testTaskUpdated;
      const idx = tests.findIndex(
        (test) => test.algorithmGID === data.algorithmGID
      );
      if (idx < 0) return;
      const updatedTests = [...tests];
      Object.assign(updatedTests[idx], data);
      setTests(updatedTests);
    } catch (err) {
      console.error(err);
    }
  }, [updatedTest]);

  useEffect(() => {
    if (!reportUpdate || !reportUpdate.reportStatusUpdated) return;
    const updates = reportUpdate.reportStatusUpdated;
    setSelectedReport((prevState) => ({
      ...prevState,
      ...updates,
    }));
    if (updates.status === ProjectReportStatus.ReportGenerated) {
      fetchUpdatedReport();
    }
  }, [reportUpdate]);

  useEffect(() => {
    fetchTestLogs();
  }, [tests, reportUpdate]);

  useEffect(() => {
    fetchTestLogs();
  }, []);

  return (
    <div className="mainContainer">
      <div className={styles.container__limits}>
        <div className={styles.layout}>
          <div style={{ width: '85%' }}>
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <h3 className="screenHeading" style={{ marginBottom: '15px' }}>
                {getStatus()}
              </h3>
              <p
                className="headingDescription"
                style={{ marginBottom: '15px' }}>
                The AI Model is being tested based on the widgets added onto the
                canvas.
                <br />
                The test results will be populated in the report generated.
                Large testing datasets will require longer processing time.
              </p>
              {selectedReport.status === ProjectReportStatus.ReportGenerated ? (
                <button
                  className="aivBase-button aivBase-button--primary aivBase-button--medium"
                  onClick={handleViewReportClick(report.projectID)}
                  style={{ padding: '10px', height: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icon
                      name={IconName.PDF}
                      color="#FFFFFF"
                      size={30}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>View Report</div>
                  </div>
                </button>
              ) : null}
            </div>
            {tests.map((test, i) => (
              <TestRunStatus
                key={`report-status-${test.algorithmGID}`}
                test={test}
                logs={logsList[i]}
                report={selectedReport}
                onCancel={() => {
                  test.status = TestEngineTaskStatus.Cancelled;
                }}
              />
            ))}
            {!tests || tests.length == 0 ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <p className="headingDescription">
                  No technical tests required for this report
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
