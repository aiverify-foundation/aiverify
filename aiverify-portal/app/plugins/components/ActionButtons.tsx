import Link from 'next/link';
import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div className="flex">
    <Link href="/plugins/upload">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="UPLOAD PLUGIN"
      />
    </Link>
  </div>
);

export default ActionButtons;
