import React, { useState } from 'react';
import { Algorithm } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { downloadAlgorithm } from '@/lib/fetchApis/downloadAlgorithm';


type AlgorithmProps = {
    algorithm: Algorithm;
};

const AlgorithmCard: React.FC<AlgorithmProps> = ({ algorithm }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadAlgorithm = async (gid: string, cid:string) => {
        setIsLoading(true);
        try {
            const response = await downloadAlgorithm(gid, cid);
            // Create a Blob URL from the response
            const fileBlob = await response.blob();
            const url = window.URL.createObjectURL(fileBlob);
        
            // Extract the filename from the Content-Disposition header
            const disposition = response.headers.get('Content-Disposition') || '';
            const filenameMatch = disposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : 'algorithm.zip';
        
            // Trigger the file download
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
        
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            } catch (error) {
            alert('Failed to download the algorithm file. Please try again.');
            } finally {
            setIsLoading(false);
            }
    };

    return (
        <div className="bg-secondary-800 p-6 mb-8" >
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
            <div className='flex justify-end'>
                <Button
                    pill
                    textColor="white"
                    variant={ButtonVariant.OUTLINE}
                    size="sm"
                    text="DOWNLOAD ALGORITHM"
                    color="var(--color-primary-500)"
                    onClick={() => handleDownloadAlgorithm(algorithm.gid, algorithm.cid)}
                    />
            </div>
        </div>

    );
};

export default AlgorithmCard;