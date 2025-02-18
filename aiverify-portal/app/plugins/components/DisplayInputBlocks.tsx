import React from 'react';
import { inputBlock } from '@/app/plugins/utils/types';

type InputBlocksProps = {
  input_block: inputBlock;
};

const InputBlockCard: React.FC<InputBlocksProps> = ({ input_block }) => {
  return (
    <div
      className="mb-8 rounded-lg border border-secondary-300 bg-secondary-800 p-6"
      role="region"
      aria-labelledby={`input-block-${input_block.gid || input_block.cid}`}>
      <h3
        id={`input-block-${input_block.gid || input_block.cid}`}
        className="text-xl font-semibold">
        {input_block.name}
      </h3>
      {/* Metadata of Widget; did not include script, module name, zip_hash */}
      <p className="mb-4 text-sm">
        {input_block.description || 'No description provided.'}
      </p>
      <ul
        className="text-sm"
        role="list">
        {input_block.gid && (
          <li role="listitem">
            <strong>GID:</strong> {input_block.gid}:{input_block.cid}
          </li>
        )}
        {input_block.cid && (
          <li role="listitem">
            <strong>CID:</strong> {input_block.cid}
          </li>
        )}
        {input_block.version && (
          <li role="listitem">
            <strong>Version:</strong> {input_block.version || 'N/A'}
          </li>
        )}
        {input_block.author && (
          <li role="listitem">
            <strong>Author:</strong> {input_block.author}
          </li>
        )}
        {input_block.group && (
          <li role="listitem">
            <strong>Group:</strong> {input_block.group}
          </li>
        )}
        {input_block.width && (
          <li role="listitem">
            <strong>Width:</strong> {input_block.width}
          </li>
        )}
        {input_block.tags && (
          <li role="listitem">
            <strong>Tags:</strong> {input_block.tags}
          </li>
        )}
      </ul>
    </div>
  );
};

export default InputBlockCard;
