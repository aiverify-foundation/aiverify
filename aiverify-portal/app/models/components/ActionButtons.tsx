import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import Link from 'next/link';

const ActionButtons: React.FC = () => (
  <div className="flex">
    <Link href="/models/upload">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="UPLOAD MODEL"
      />
    </Link>
  </div>
);

export default ActionButtons;