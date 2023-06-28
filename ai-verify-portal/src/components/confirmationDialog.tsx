import { AlertBox, AlertBoxFixedPositions, AlertBoxSize } from './alertBox';

type CustomDialogProps = {
  size?: AlertBoxSize;
  primaryBtnText?: string;
  showOKBtn?: boolean;
  title: string;
  message?: string;
  children?: React.ReactElement;
  onClose: (confirm: boolean) => void;
};

function ConfirmationDialog(props: CustomDialogProps) {
  const {
    size = AlertBoxSize.SMALL,
    primaryBtnText = 'Proceed',
    showOKBtn = false,
    title,
    children,
    message,
    onClose,
  } = props;

  function handleCancel() {
    if (onClose) onClose(false);
  }

  function handleConfirm() {
    if (onClose) onClose(true);
  }

  return (
    <AlertBox
      enableModalOverlay
      size={size}
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={handleCancel}>
      <AlertBox.Header heading={title} />
      <AlertBox.Body hasFooter>
        <div>{message}</div>
        <div>{children}</div>
      </AlertBox.Body>
      <AlertBox.Footer>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
          {showOKBtn ? (
            <button
              className="aivBase-button aivBase-button--primary aivBase-button--small"
              onClick={handleCancel}>
              OK
            </button>
          ) : (
            <div>
              <button
                className="aivBase-button aivBase-button--secondary aivBase-button--small"
                onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="aivBase-button aivBase-button--primary aivBase-button--small"
                onClick={handleConfirm}>
                {primaryBtnText}
              </button>
            </div>
          )}
        </div>
      </AlertBox.Footer>
    </AlertBox>
  );
}

export default ConfirmationDialog;
