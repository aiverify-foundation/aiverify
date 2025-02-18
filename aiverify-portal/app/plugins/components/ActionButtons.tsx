import Link from 'next/link';
import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div
    className="flex"
    role="group"
    aria-label="upload plugin button">
    <Link
      href="/plugins/upload"
      passHref>
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="UPLOAD PLUGIN"
        aria-label="upload plugin"
      />
    </Link>
  </div>
);

export default ActionButtons;
