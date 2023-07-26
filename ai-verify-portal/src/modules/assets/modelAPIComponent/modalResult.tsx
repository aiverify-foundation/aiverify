import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';

type ModalResultProps = {
  size?: AlertBoxSize;
  title: string;
  message?: string;
  children?: React.ReactElement;
  onCloseClick: () => void;
  onOkClick: () => void;
};

function ModalResult(props: ModalResultProps) {
  const { size, title, message, children, onCloseClick, onOkClick } = props;
  return (
    <AlertBox
      size={size || AlertBoxSize.MEDIUM}
      renderInPortal
      enableModalOverlay
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onCloseClick}>
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
          <button
            className="aivBase-button aivBase-button--primary aivBase-button--small"
            onClick={onOkClick}>
            OK
          </button>
        </div>
      </AlertBox.Footer>
    </AlertBox>
  );
}

export { ModalResult };
