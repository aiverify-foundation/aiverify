import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

interface Artifact {
  name: string;
  type: string | null;
  data: Blob | string;
}

type ArtifactModalProps = {
  isOpen: boolean;
  artifact: Artifact;
  onClose: () => void;
  onDownload: () => void;
};

const ArtifactModal = ({
  isOpen,
  artifact,
  onClose,
  onDownload,
}: ArtifactModalProps) => {
  const [content, setContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadContent = async () => {
      if (!artifact.type) {
        setContent(
          <div>Unable to display artifact: Missing type information</div>
        );
        return;
      }

      if (artifact.type.startsWith('image/')) {
        // For image types, ensure we have a Blob
        const blob =
          artifact.data instanceof Blob
            ? artifact.data
            : new Blob([String(artifact.data)]);
        setContent(
          <Image
            src={URL.createObjectURL(blob)}
            alt="Artifact"
            className="h-auto max-w-full"
            width={260}
            height={500}
          />
        );
        return;
      }

      if (
        artifact.type === 'application/json' ||
        artifact.type.startsWith('text/')
      ) {
        try {
          // For text types, ensure data is treated as string
          const textData =
            typeof artifact.data === 'string'
              ? artifact.data
              : new TextDecoder().decode(
                  new Uint8Array(await (artifact.data as Blob).arrayBuffer())
                );

          const artifactText =
            artifact.type === 'application/json'
              ? JSON.stringify(JSON.parse(textData), null, 2) // JSON stringified for readability
              : textData;

          setContent(
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap bg-secondary-800 p-4 text-white">
              {artifactText}
            </pre>
          );
        } catch (error) {
          console.error('Error rendering artifact content:', error);
          setContent(
            <div className="text-center text-red-500">
              <p>Unable to render artifact content as text.</p>
            </div>
          );
        }
        return;
      }

      setContent(
        <div className="text-center text-black">
          <p>Cannot display this artifact type. Click download to save it.</p>
        </div>
      );
    };

    loadContent();
  }, [artifact, isOpen]);

  if (!isOpen) return null; // Don't render modal if not open

  return (
    <div className="fixed inset-0 z-50">
      {/* background */}
      <div className="fixed inset-0 bg-secondary-950 opacity-80" />
      {/* popup */}
      <div className="relative mx-auto mt-20 max-w-4xl rounded-lg border-secondary-300 bg-secondary-950 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{artifact.name}</h3>
        </div>
        <div className="mt-4 flex items-center justify-center">{content}</div>
        <div className="mt-4 flex justify-end space-x-4">
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="CLOSE"
            color="primary-950"
            onClick={onClose}
          />
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="DOWNLOAD"
            color="primary-950"
            onClick={onDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default ArtifactModal;
