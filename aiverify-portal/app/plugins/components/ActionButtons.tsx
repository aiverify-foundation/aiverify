import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div className="flex">
    <Button
      pill
      textColor="white"
      variant={ButtonVariant.OUTLINE}
      size="sm"
      text="IMPORT PLUGIN"
    />
  </div>
);

export default ActionButtons;