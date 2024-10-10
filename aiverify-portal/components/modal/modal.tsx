import React from 'react';
import { Icon, IconName } from '../IconSVG';
import { Button, ButtonVariant } from '../button';

type ModalProps = {
  top?: React.CSSProperties['top'];
  left?: React.CSSProperties['left'];
  width?: React.CSSProperties['width'];
  height?: React.CSSProperties['height'];
  bgColor?: React.CSSProperties['backgroundColor'];
  textColor?: React.CSSProperties['color'];
  headingColor?: React.CSSProperties['color'];
  heading: string;
  hideCloseIcon?: boolean;
  children: React.ReactNode;
  enableScreenOverlay: boolean;
  overlayOpacity?: React.CSSProperties['opacity'];
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  onPrimaryBtnClick?: () => void;
  onSecondaryBtnClick?: () => void;
  onCloseIconClick: () => void;
};

function Modal(props: ModalProps) {
  const {
    top,
    left,
    width = 500,
    height = 260,
    bgColor,
    textColor,
    headingColor,
    heading,
    hideCloseIcon = false,
    children,
    primaryBtnLabel,
    secondaryBtnLabel,
    enableScreenOverlay,
    overlayOpacity = 0.3,
    onPrimaryBtnClick,
    onSecondaryBtnClick,
    onCloseIconClick,
  } = props;

  return (
    <>
      {enableScreenOverlay && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
          style={{
            opacity: overlayOpacity,
          }}
        />
      )}
      <div
        className="absolute left-1/2 top-1/2 z-[1000] h-[260px] w-[600px]
        -translate-x-1/2 -translate-y-1/2 transform rounded-[15px] 
        bg-gradient-to-b from-secondary-600 to-secondary-700 p-6 dark:bg-secondary-700"
        style={{
          top,
          left,
          width,
          height,
          backgroundColor: bgColor,
          color: textColor,
          boxShadow: '2px 2px 16px rgba(0,0,0,.6)',
        }}
      >
        <header className="mb-3 flex justify-between" style={{ color: headingColor }}>
          <h1 className="text-[1.4rem] font-normal text-primary-100">{heading}</h1>
          {!hideCloseIcon ? (
            <Icon
              name={IconName.Close}
              onClick={onCloseIconClick}
              size={25}
              svgClassName="stroke-primary-300 dark:stroke-primary-300"
            />
          ) : null}
        </header>
        <main style={{ height: 'calc(100% - 20px' }}>{children}</main>
        {(onSecondaryBtnClick || onPrimaryBtnClick) && (
          <footer className="absolute bottom-0 left-0 mt-4 flex w-full items-center justify-end gap-2 p-4">
            {onSecondaryBtnClick && (
              <Button
                bezel
                variant={ButtonVariant.SECONDARY}
                onClick={onSecondaryBtnClick}
                text={secondaryBtnLabel || ''}
                size="sm"
              />
            )}
            {onPrimaryBtnClick && (
              <Button
                bezel
                variant={ButtonVariant.PRIMARY}
                onClick={onPrimaryBtnClick}
                text={primaryBtnLabel || ''}
                size="sm"
              />
            )}
          </footer>
        )}
      </div>
    </>
  );
}

export { Modal };
