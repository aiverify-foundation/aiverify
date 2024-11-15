import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

const ActionButtons: React.FC = () => (
  <div className="flex gap-2">
    <Button
      pill
      textColor="white"
      variant={ButtonVariant.OUTLINE}
      size="sm"
      text="RUN NEW TESTS"
    />
    
    <Button
      pill
      textColor="white"
      variant={ButtonVariant.OUTLINE}
      size="sm"
      text="UPLOAD TEST RESULTS"
    />
  </div>
);

export default ActionButtons;