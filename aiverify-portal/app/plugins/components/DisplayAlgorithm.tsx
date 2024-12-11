import React from 'react';
import { Algorithm } from '../utils/types';

type AlgorithmProps = {
    algorithm: Algorithm;
};

const AlgorithmCard: React.FC<AlgorithmProps> = ({ algorithm }) => {

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
        </div>

    );
};

export default AlgorithmCard;