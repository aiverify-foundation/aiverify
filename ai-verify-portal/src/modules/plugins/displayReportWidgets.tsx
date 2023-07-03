import { PropsWithChildren, useState } from 'react';
import AIFPlugin, {
  ComponentDependency,
  ReportWidget,
} from 'src/types/plugin.interface';
import CodeBlockDialog from './codeBlockDialog';
import styles from './styles/plugins.module.css';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import clsx from 'clsx';

type DisplayReportWidgetsProps = {
  plugin: AIFPlugin;
};

type StatusBadgeColors =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

enum Status {
  OK,
  MISSING_DEPDENCIES,
}

type StatusBadgeProps = {
  status: Status;
};

function StatusBadge({ status }: StatusBadgeProps) {
  let statusText = '';
  let color: StatusBadgeColors = 'default';

  switch (status) {
    case Status.OK:
      color = 'success';
      statusText = 'Dependencies OK';
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
    case Status.MISSING_DEPDENCIES:
      color = 'error';
      statusText = 'Missing Dependencies';
      return (
        <Chip
          icon={<ErrorIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
    default:
      color = 'success';
      statusText = 'Dependencies OK';
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label={statusText}
          variant="outlined"
          color={color}
        />
      );
  }
}

export default function DisplayReportWidgets(
  props: PropsWithChildren<DisplayReportWidgetsProps>
) {
  const { plugin } = props;
  const [selectedProperties, setSelectedProperties] = useState<ReportWidget>();
  const [selectedMockData, setSelectedMockData] = useState<ReportWidget>();
  const dateTimeDisplay = new Date(plugin.installedAt).toLocaleString('en-GB');

  const handleClickSelectedProperties = (widget: ReportWidget) => {
    setSelectedProperties(widget);
  };

  const handleCloseSelectedProperties = () => {
    setSelectedProperties(undefined);
  };

  const handleClickSelectedMockData = (widget: ReportWidget) => {
    setSelectedMockData(widget);
  };

  const handleCloseSelectedMockData = () => {
    setSelectedMockData(undefined);
  };

  type DependencyStatus = {
    requirement: string;
    isValid: boolean;
  };

  function DependencyStatus(props: DependencyStatus) {
    const { requirement, isValid } = props;

    return (
      <div className={styles.valueDisplay}>
        <div className={styles.statusIcon}>
          {isValid ? (
            <TaskAltIcon style={{ color: '#52be52', fontSize: '18px' }} />
          ) : (
            <ErrorOutlineIcon style={{ color: '#f73939', fontSize: '19px' }} />
          )}
        </div>
        <div className={styles.value}>{requirement}</div>
      </div>
    );
  }

  function WidgetDependencies({
    dependencies,
  }: {
    dependencies: ComponentDependency[];
  }) {
    return dependencies && dependencies.length ? (
      <div className={styles.algoRequirements}>
        <h4>Required Dependencies</h4>
        <div style={{ margin: '10px' }}>
          {dependencies.map((dep) => (
            <DependencyStatus
              key={dep.gid}
              requirement={dep.gid}
              isValid={dep.valid}
            />
          ))}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className={styles.componentDetails}>
      <div>
        {plugin.reportWidgets
          ? plugin.reportWidgets.map((widget) => {
              const status =
                widget.status === 'OK' ? Status.OK : Status.MISSING_DEPDENCIES;
              return (
                <div
                  className={clsx('pluginDetails-card', styles.componentCard)}
                  key={`widget-${widget.gid}`}>
                  <div style={{ position: 'relative' }}>
                    <h2 className={styles.detailsHeading}>{widget.name}</h2>
                    <div
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '15px',
                      }}>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <p className={styles.componentDesc}>{widget.description}</p>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>GID:</div>
                    <div className={styles.value} style={{ color: '#991E66' }}>
                      {widget.gid}
                    </div>
                  </div>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>CID:</div>
                    <div className={styles.value}>{widget.cid}</div>
                  </div>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Version:</div>
                    <div className={styles.value}>{widget.version}</div>
                  </div>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>
                      Dimensions (width x height):{' '}
                    </div>
                    <div className={styles.value}>
                      Min: {widget.widgetSize?.minW}x{widget.widgetSize?.minH} /
                      Max: {widget.widgetSize?.maxW}x{widget.widgetSize?.maxH}
                    </div>
                  </div>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Installed on:</div>
                    <div className={styles.value}>{dateTimeDisplay}</div>
                  </div>
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Author:</div>
                    <div className={styles.value}>{plugin.author}</div>
                  </div>
                  {plugin.url ? (
                    <div className={styles.valueDisplay}>
                      <div className={styles.label}>Url:</div>
                      <div className={styles.value}>
                        <a href={plugin.url} target="_blank">
                          {plugin.url}
                        </a>
                      </div>
                    </div>
                  ) : null}
                  {widget.tags ? (
                    <div className={styles.valueDisplay}>
                      <div className={styles.label}>Tags:</div>
                      <div className={styles.value}>
                        {widget.tags.join(', ')}
                      </div>
                    </div>
                  ) : null}
                  <div style={{ margin: '15px' }}>
                    {widget.dependencies ? (
                      <WidgetDependencies dependencies={widget.dependencies} />
                    ) : null}
                  </div>
                  {widget.properties || widget.mockdata ? (
                    <div className={styles.footerBtnGroup}>
                      <button
                        className="aivBase-button aivBase-button--outlined aivBase-button--small"
                        onClick={() => handleClickSelectedProperties(widget)}>
                        Properties
                      </button>
                      <button
                        className="aivBase-button aivBase-button--outlined aivBase-button--small"
                        onClick={() => handleClickSelectedMockData(widget)}>
                        Sample Data
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          : null}
        {selectedProperties && (
          <CodeBlockDialog
            id="dialog-inputSchema"
            open={!!selectedProperties}
            onClose={handleCloseSelectedProperties}
            title={selectedProperties.name + ' Properties Schema'}
            text={JSON.stringify(selectedProperties.properties, null, 2)}
          />
        )}
        {selectedMockData && (
          <CodeBlockDialog
            id="dialog-mockdata"
            open={!!selectedMockData}
            onClose={handleCloseSelectedMockData}
            title={selectedMockData.name + ' Sample Data'}
            text={JSON.stringify(selectedMockData.mockdata, null, 2)}
          />
        )}
      </div>
    </div>
  );
}
