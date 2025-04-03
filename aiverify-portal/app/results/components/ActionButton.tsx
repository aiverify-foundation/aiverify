import Link from 'next/link';
import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div className="flex gap-2">
    <Link href="/results/run">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="RUN NEW TESTS"
      />
    </Link>
    <Link href="/results/upload/zipfile">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="UPLOAD TEST RESULTS"
      />
    </Link>
  </div>
);

export default ActionButtons;
