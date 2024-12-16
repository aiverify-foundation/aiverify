import React from 'react';
import PluginUploader from './components/PluginUploader';
import { Icon, IconName } from '@/lib/components/IconSVG';

const UploadPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon name={IconName.Plug} size={40} color="#FFFFFF" />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Plugin Manager</h1>
            <h3 className="text-white">Manage plugins, their templates and algorithms.</h3>
          </div>
        </div>
      </div>
      <PluginUploader />
    </div>
  );
};

export default UploadPage;