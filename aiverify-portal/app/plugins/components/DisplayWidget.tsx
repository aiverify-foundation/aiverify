import React, { useState } from 'react';
import { Widget } from '@/app/types'; // Updated import
import { Button, ButtonVariant } from '@/lib/components/button';
import { TaskAltIcon, CheckCircleIcon } from '../utils/icons';
import { Modal } from '@/lib/components/modal';

type WidgetProps = {
    widget: Widget;
  };
  
  const WidgetDisplay: React.FC<WidgetProps> = ({ widget }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalHeading, setModalHeading] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleViewProperties = () => {
        if (widget.properties) {
        setModalHeading('Widget Properties');
        setModalContent(JSON.stringify(widget.properties, null, 2));
        setModalOpen(true);
        } else {
        alert('No properties available.');
        }
    };

    const handleViewSampleData = () => {
        if (widget.mockdata) {
        setModalHeading('Mock Data');
        setModalContent(JSON.stringify(widget.mockdata, null, 2));
        setModalOpen(true);
        } else {
        alert('No mock data available.');
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalContent(null);
    };
    
    return (
      <div className="bg-secondary-800 border border-secondary-300 p-6 rounded-lg mb-8" >
        <div className='flex items-center justify-between space-x-2'>
            <h3 className='font-semibold text-xl'>{widget.name}</h3>
            <div className="flex items-center p-1 pr-2 border-2 border-[#25A167] rounded-full space-x-1">
                {widget.dependencies.every((dep) => dep.cid) ? (
                    <>
                    <CheckCircleIcon color="#25A167" />
                    <span style={{ color: "#25A167", fontWeight: "bold" }}>Dependencies OK</span>
                    </>
                ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>Missing Dependencies</span>
                )}
            </div>
        </div>
        <p className='text-base mb-2'>{widget.description || "No description provided."}</p>
        <ul className="text-sm">
            {widget.gid && (
                <li>
                <strong>GID:</strong> {widget.gid}:{widget.cid}
              </li>
            )}
            {widget.cid && (
                <li>
                <strong>CID:</strong> {widget.cid}
              </li>
            )}
            {widget.version && (
                <li>
                <strong>Version:</strong> {widget.version || "N/A"}
            </li>
            )}
            {widget.widgetSize && (
                <li>
                <strong>Dimensions:</strong> Min: {widget.widgetSize.minW}x{widget.widgetSize.minH} / Max:{" "}
                {widget.widgetSize.maxW}x{widget.widgetSize.maxH}
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
        </ul>
        {widget.dependencies && widget.dependencies.length > 0 && (
            <div className='mt-2'>
                <strong>Required Dependencies:</strong>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                {widget.dependencies.map((dep, index) => (
                    <li key={index} style={{ display: "flex", alignItems: "center" }}>
                    <span
                        style={{
                        color: dep.gid ? "green" : "red",
                        marginRight: "8px",
                        }}
                    >
                        {dep.cid ? <TaskAltIcon color='#25A167'/> : "❌"}
                    </span>
                    {dep.cid}
                    </li>
                ))}
                </ul>
            </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {widget.properties && (
                <Button
                pill
                textColor="white"
                variant={ButtonVariant.PRIMARY}
                size="sm"
                text="PROPERTIES"
                color='primary-950'
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
                color='primary-950'
                onClick={() => handleViewSampleData()}
                />
            )}
        </div>
        {isModalOpen && (
            <div className='fixed inset-0 flex items-center justify-center z-50'>
                <Modal
                heading={modalHeading}
                bgColor="var(--color-secondary-950)"
                textColor="white"
                onCloseIconClick={closeModal}
                enableScreenOverlay
                overlayOpacity={75}
                width={600}
                height={400}
                >
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{modalContent}</pre>
                </Modal>
            </div>
        )}
    </div>
    );
  };


export default WidgetDisplay;