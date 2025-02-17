import React, { useState } from 'react';
import { Algorithm } from '@/app/plugins/utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';

type AlgorithmProps = {
    algorithm: Algorithm;
};

const AlgorithmCard: React.FC<AlgorithmProps> = ({ algorithm }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<string>("");

    const openSchemaModal = (schemaType: "input" | "output") => {
        if (schemaType === "input") {
            setModalContent(JSON.stringify(algorithm.inputSchema, null, 2));
        } else if (schemaType === "output") {
            setModalContent(JSON.stringify(algorithm.outputSchema, null, 2));
        }
        setIsModalVisible(true);
    };
    return (
        <div className="bg-secondary-800 border border-secondary-300 p-6 rounded-lg mb-8" >
            <h3 className='font-semibold text-xl'>{algorithm.name}</h3>
            {/* Metadata of Widget; did not include script, module name, zip_hash */}
            <p className='text-sm mb-4'>{algorithm.description || "No description provided."}</p>
            <ul className="text-sm">
                {algorithm.gid && (
                    <li>
                    <strong>GID:</strong> {algorithm.gid}:{algorithm.cid}
                    </li>
                )}
                {algorithm.cid && (
                    <li>
                    <strong>CID:</strong> {algorithm.cid}
                    </li>
                )}
                {algorithm.version && (
                    <li>
                    <strong>Version:</strong> {algorithm.version || "N/A"}
                </li>
                )}
                {algorithm.modelType && algorithm.modelType.length > 0 && (
                    <li>
                        <strong>Modal Type:</strong> {algorithm.modelType.join(", ")}
                    </li>
                )}
                {algorithm.requireGroundTruth && (
                    <li>
                        <strong>Require Ground Truth: </strong> {algorithm.requireGroundTruth}
                    </li>
                )}
                {algorithm.language && (
                    <li>
                        <strong>Language: </strong> {algorithm.language}
                    </li>
                )}
                {algorithm.author && (
                <li>
                    <strong>Author:</strong> {algorithm.author}
                </li>
                )}
                {algorithm.tags && algorithm.tags.length > 0 && (
                    <li>
                    <strong>Tags:</strong> {algorithm.tags.join(", ")}
                    </li>
                )}
            </ul>
            <div className='flex mt-8 space-x-4'>
                {algorithm.inputSchema && (
                <Button
                    pill
                    textColor="white"
                    variant={ButtonVariant.PRIMARY}
                    size="sm"
                    text="INPUT SCHEMA"
                    color='var(--color-primary-600)'
                    onClick={() => openSchemaModal("input")}
                />
                )}
                {algorithm.outputSchema && (
                <Button
                    pill
                    textColor="white"
                    variant={ButtonVariant.PRIMARY}
                    size="sm"
                    text="OUTPUT SCHEMA"
                    color='var(--color-primary-600)'
                    onClick={() => openSchemaModal("output")}
                />
                )}
            </div>
            {isModalVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <Modal
                        bgColor="var(--color-primary-500)"
                        textColor="white"
                        onCloseIconClick={() => setIsModalVisible(false)}
                        enableScreenOverlay
                        heading={`${modalContent.includes("input") ? "Input" : "Output"} Schema`}
                        width={900}
                        height={600}
                    >
                    <div className="max-h-full overflow-y-auto p-4">
                        <pre className='whitespace-pre-wrap break-words'>{modalContent}</pre>
                    </div>
                    </Modal>
                </div>
            )}
        </div>

    );
};

export default AlgorithmCard;