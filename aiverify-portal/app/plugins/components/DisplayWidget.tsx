import React, { useState } from 'react';
import {
  TaskAltIcon,
  CheckCircleIcon,
  CrossCircleIcon,
} from '@/app/plugins/utils/icons';
import { Widget } from '@/app/plugins/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';

type WidgetProps = {
  widget: Widget;
};

const WidgetCard: React.FC<WidgetProps> = ({ widget }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalHeading, setModalHeading] = useState<string>('');

  const handleViewProperties = () => {
    if (widget.properties) {
      setModalHeading('Widget Properties');
      setModalContent(JSON.stringify(widget.properties, null, 2));
      setModalOpen(true);
    } else {
      setModalHeading('Widget Properties');
      setModalContent('No properties available.');
      setModalOpen(true);
    }
  };

  const handleViewSampleData = () => {
    if (widget.mockdata) {
      setModalHeading('Mock Data');
      setModalContent(JSON.stringify(widget.mockdata, null, 2));
      setModalOpen(true);
    } else {
      setModalHeading('Mock Data');
      setModalContent('No mock data available.');
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  return (
    <div className="mb-8 rounded-lg border border-secondary-300 bg-secondary-800 p-6">
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-xl font-semibold">{widget.name}</h3>
        {/* Dependencies Check */}
        <div className="flex min-w-[180px] items-center space-x-1 break-words rounded-full border-2 border-[#25A167] p-1 pl-2 pr-2 text-center">
          {widget.dependencies.every((dep) => dep.cid) ? (
            <>
              <CheckCircleIcon color="#25A167" />
              <span style={{ color: '#25A167', fontWeight: 'bold' }}>
                Dependencies OK
              </span>
            </>
          ) : (
            <div>
              <CrossCircleIcon color="#red" />
              <span style={{ color: 'red', fontWeight: 'bold' }}>
                Missing Dependencies
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Metadata of Widget */}
      <p className="mb-2 text-base">
        {widget.description || 'No description provided.'}
      </p>
      <ul className="text-sm">
        {widget.gid && (
          <li>
            <strong>GID:</strong>{' '}
            <span style={{ color: 'var(--color-primary-400)' }}>
              {widget.gid}:{widget.cid}
            </span>
          </li>
        )}
        {widget.cid && (
          <li>
            <strong>CID:</strong> {widget.cid}
          </li>
        )}
        {widget.version && (
          <li>
            <strong>Version:</strong> {widget.version || 'N/A'}
          </li>
        )}
        {widget.widgetSize && (
          <li>
            <strong>Dimensions:</strong> Min: {widget.widgetSize.minW}x
            {widget.widgetSize.minH} / Max: {widget.widgetSize.maxW}x
            {widget.widgetSize.maxH}
          </li>
        )}
        {widget.author && (
          <li>
            <strong>Author:</strong> {widget.author}
          </li>
        )}
        {widget.tags && (
          <li>
            <strong>Tags:</strong> {widget.tags}
          </li>
        )}
        {widget.dependencies && widget.dependencies.length > 0 && (
          <div className="mt-2 text-sm">
            <strong>Required Dependencies:</strong>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {widget.dependencies.map((dep, index) => (
                <li
                  key={index}
                  style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      color: dep.gid ? 'green' : 'red',
                      marginRight: '8px',
                    }}>
                    {dep.cid ? (
                      <TaskAltIcon color="#25A167" />
                    ) : (
                      <Icon
                        name={IconName.Warning}
                        color="var(--color-danger)"
                      />
                    )}
                  </span>
                  {dep.cid}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ul>
      {/* Buttons for Widget Properties & Mock Data */}
      <div className="mt-8 flex space-x-4">
        {widget.properties && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="PROPERTIES"
            color="var(--color-primary-600)"
            onClick={() => handleViewProperties()}
          />
        )}
        {widget.mockdata && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="MOCK DATA"
            color="var(--color-primary-600)"
            onClick={() => handleViewSampleData()}
          />
        )}
      </div>
      {/* Modal for properties and mock data */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <Modal
            heading={modalHeading}
            bgColor="var(--color-secondary-950)"
            textColor="white"
            onCloseIconClick={closeModal}
            enableScreenOverlay
            width={600}
            height={400}>
            <div className="h-72 overflow-y-auto p-4">
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

export default WidgetCard;
