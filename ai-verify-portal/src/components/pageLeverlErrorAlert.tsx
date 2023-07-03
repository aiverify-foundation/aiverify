import { AlertType, StandardAlert } from 'src/components/standardAlerts';

type PageLevelErrorAlertProps = {
  error: Error;
  headingText: string;
  content: string;
};

function PageLevelErrorAlert(props: PageLevelErrorAlertProps) {
  const { error, headingText, content } = props;
  return (
    <div
      style={{
        width: '100%',
        margin: 'auto',
        marginTop: '20px',
      }}>
      <StandardAlert
        alertType={AlertType.ERROR}
        headingText={headingText}
        disableCloseIcon>
        <div>
          <div>{content}</div>
          {error ? (
            <div style={{ color: '#f73939', marginLeft: '5px' }}>
              (Err: {error.message})
            </div>
          ) : null}
        </div>
      </StandardAlert>
    </div>
  );
}

export { PageLevelErrorAlert };
