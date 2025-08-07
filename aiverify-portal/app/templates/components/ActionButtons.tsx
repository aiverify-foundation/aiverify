import Link from 'next/link';
import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div
    className="flex h-full items-center"
    role="group"
    aria-label="upload template button">
    <Link href="/templates/upload">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="UPLOAD TEMPLATE"
        aria-label="upload template"
        className="my-auto"
      />
    </Link>
  </div>
);

export default ActionButtons;
