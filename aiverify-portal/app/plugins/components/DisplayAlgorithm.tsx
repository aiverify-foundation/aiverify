import React, { useState } from 'react';
import { Algorithm } from '@/app/plugins/utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';

type AlgorithmProps = {
  algorithm: Algorithm;
};

const AlgorithmCard: React.FC<AlgorithmProps> = ({ algorithm }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');

  const openSchemaModal = (schemaType: 'input' | 'output') => {
    if (schemaType === 'input') {
      setModalContent(JSON.stringify(algorithm.inputSchema, null, 2));
    } else if (schemaType === 'output') {
      setModalContent(JSON.stringify(algorithm.outputSchema, null, 2));
    }
    setIsModalVisible(true);
  };
  return (
    <div
      className="mb-8 rounded-lg border border-secondary-300 bg-secondary-800 p-6"
      role="region"
      aria-labelledby={`algorithm-${algorithm.gid || algorithm.cid}`}>
      <h3
        id={`algorithm-${algorithm.gid || algorithm.cid}`}
        className="text-xl font-semibold">
        {algorithm.name}
      </h3>
      {/* Metadata of Widget; did not include script, module name, zip_hash */}
      <p className="mb-4 text-sm">
        {algorithm.description || 'No description provided.'}
      </p>
      <ul
        className="text-sm"
        role="list of metadata of algorithm">
        {algorithm.gid && (
          <li role="listitem">
            <strong>GID:</strong> {algorithm.gid}:{algorithm.cid}
          </li>
        )}
        {algorithm.cid && (
          <li role="listitem">
            <strong>CID:</strong> {algorithm.cid}
          </li>
        )}
        {algorithm.version && (
          <li role="listitem">
            <strong>Version:</strong> {algorithm.version || 'N/A'}
          </li>
        )}
        {algorithm.modelType && algorithm.modelType.length > 0 && (
          <li role="listitem">
            <strong>Modal Type:</strong> {algorithm.modelType.join(', ')}
          </li>
        )}
        {algorithm.requireGroundTruth && (
          <li role="listitem">
            <strong>Require Ground Truth: </strong>{' '}
            {algorithm.requireGroundTruth}
          </li>
        )}
        {algorithm.language && (
          <li role="listitem">
            <strong>Language: </strong> {algorithm.language}
          </li>
        )}
        {algorithm.author && (
          <li role="listitem">
            <strong>Author:</strong> {algorithm.author}
          </li>
        )}
        {algorithm.tags && algorithm.tags.length > 0 && (
          <li role="listitem">
            <strong>Tags:</strong> {algorithm.tags.join(', ')}
          </li>
        )}
      </ul>
      <div
        className="mt-8 flex space-x-4"
        role="group"
        aria-label="Schema buttons">
        {algorithm.inputSchema && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="INPUT SCHEMA"
            color="var(--color-primary-600)"
            onClick={() => openSchemaModal('input')}
            aria-label="View input schema"
          />
        )}
        {algorithm.outputSchema && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="OUTPUT SCHEMA"
            color="var(--color-primary-600)"
            onClick={() => openSchemaModal('output')}
            aria-label="View output schema"
          />
        )}
      </div>
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={() => setIsModalVisible(false)}
            enableScreenOverlay
            heading={`${modalContent.includes('input') ? 'Input' : 'Output'} Schema`}
            width={900}
            height={600}
            aria-label="Schema details modal"
            aria-modal="true">
            <div className="max-h-full overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-words">
                {modalContent}
              </pre>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default AlgorithmCard;
