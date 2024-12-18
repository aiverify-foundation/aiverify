import React from 'react';
import PluginUploader from './components/PluginUploader';
import { Icon, IconName } from '@/lib/components/IconSVG';

const UploadPage: React.FC = () => {
  return (
    <div className="p-6">
      <PluginUploader />
    </div>
  );
};

export default UploadPage;