import { AlertType, StandardAlert } from 'src/components/standardAlerts';

function CanvasErrorFallback({ error }: { error: Error }) {
  return (
    <div
      style={{
        width: '794px',
        margin: 'auto',
        marginTop: '20px',
      }}>
      <StandardAlert
        alertType={AlertType.ERROR}
        headingText="Canvas Loading Error"
        disableCloseIcon>
        <div>
          <div>There was an error loading canvas.</div>
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

export { CanvasErrorFallback };
