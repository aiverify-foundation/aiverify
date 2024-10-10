'use client';

import { Modal } from '@/components/modal';

export function Homepage() {
  return (
    <Modal
      heading="New AIV work in progress"
      enableScreenOverlay={false}
      height={250}
      primaryBtnLabel="Hello World"
      onCloseIconClick={() => null}
      onPrimaryBtnClick={() => alert('hello world')}>
      <p>Using Next.js</p>
    </Modal>
  );
}
