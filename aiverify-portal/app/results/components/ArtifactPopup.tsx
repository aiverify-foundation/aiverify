import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

type ArtifactModalProps = {
  isOpen: boolean;
  artifact: any; // Can be text, Blob, or other types
  onClose: () => void;
  onDownload: () => void;
};

const ArtifactModal = ({ isOpen, artifact, onClose, onDownload }: ArtifactModalProps) => {
  if (!isOpen) return null; // Don't render modal if not open

  const renderArtifactContent = () => {
    if (!artifact.type) {
      return <div>Unable to display artifact: Missing type information</div>;
    }

    if (artifact.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(artifact.data)} alt="Artifact" className="max-w-full h-auto" />;
    }

    if (artifact.type === 'application/json' || artifact.type.startsWith('text/')) {
      try {
        const artifactText =
          artifact.type === 'application/json'
            ? JSON.stringify(JSON.parse(artifact.data), null, 2) // JSON stringified for readability
            : artifact.data;

        return (
          <pre className="bg-secondary-800 max-h-80 text-white p-4 overflow-y-auto whitespace-pre-wrap">
            {artifactText}
          </pre>
        );
      } catch (error) {
        return (
          <div className="text-center text-red-500">
            <p>Unable to render artifact content as text.</p>
          </div>
        );
      }
    }

    return (
      <div className="text-center text-black">
        <p>Cannot display this artifact type. Click download to save it.</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* background */}
      <div className="fixed inset-0 bg-secondary-950 opacity-80"></div>
      {/* popup */}
      <div className="relative bg-secondary-950 border-secondary-300 text-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto mt-20">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">{artifact.name}</h3>
        </div>
        <div className="flex mt-4 items-center justify-center">{renderArtifactContent()}</div>
        <div className="flex justify-end space-x-4 mt-4">
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="CLOSE"
            color='primary-950'
            onClick={onClose}
          />
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="DOWNLOAD"
            color='primary-950'
            onClick={onDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default ArtifactModal;
