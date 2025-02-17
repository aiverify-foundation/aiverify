import React from 'react';
import { inputBlock } from '@/app/plugins/utils/types';

type InputBlocksProps = {
    input_block: inputBlock;
};

const InputBlockCard: React.FC<InputBlocksProps> = ({ input_block }) => {

    return (
        <div className="bg-secondary-800 border border-secondary-300 p-6 rounded-lg mb-8" >
            <h3 className='font-semibold text-xl'>{input_block.name}</h3>
            {/* Metadata of Widget; did not include script, module name, zip_hash */}
            <p className='text-sm mb-4'>{input_block.description || "No description provided."}</p>
            <ul className="text-sm">
                {input_block.gid && (
                    <li>
                    <strong>GID:</strong> {input_block.gid}:{input_block.cid}
                    </li>
                )}
                {input_block.cid && (
                    <li>
                    <strong>CID:</strong> {input_block.cid}
                    </li>
                )}
                {input_block.version && (
                    <li>
                    <strong>Version:</strong> {input_block.version || "N/A"}
                    </li>
                )}
                {input_block.author && (
                    <li>
                        <strong>Author:</strong> {input_block.author}
                    </li>
                )}
                {input_block.group && (
                    <li>
                        <strong>Group:</strong> {input_block.group}
                    </li>
                )}
                {input_block.width && (
                    <li>
                        <strong>Width:</strong> {input_block.width}
                    </li>
                )}
                {input_block.tags && (
                    <li>
                        <strong>Tags:</strong> {input_block.tags}
                    </li>
                )}
            </ul>
        </div>

    );
};

export default InputBlockCard;