'use client';

import { useState } from 'react';
import FileUploader from '@/app/models/upload/components/FileUploader';
import FolderUpload from '@/app/models/upload/components/FolderUploader';

const ModelUploader = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'folder'>('file');

  return (
    <div className="upload-page">
      <header className="tabs">
        <button
          className={activeTab === 'file' ? 'active' : ''}
          onClick={() => setActiveTab('file')}
        >
          File
        </button>
        <button
          className={activeTab === 'folder' ? 'active' : ''}
          onClick={() => setActiveTab('folder')}
        >
          Folder
        </button>
      </header>

      <div className="upload-form">
        {activeTab === 'file' && <FileUploader onBack={onBack}/>}
        {activeTab === 'folder' && <FolderUpload onBack={onBack}/>}
      </div>
    </div>
  );
};

export default ModelUploader;
