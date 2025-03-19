import React from 'react';
import { Template } from '@/app/plugins/utils/types';

type TemplatesProps = {
  template: Template;
};

const TemplateCard: React.FC<TemplatesProps> = ({ template }) => {
  return (
    <div
      className="mb-8 rounded-lg border border-secondary-300 bg-secondary-800 p-6"
      role="region"
      aria-labelledby={`template-${template.gid || template.cid}`}>
      <h3
        id={`template-${template.gid || template.cid}`}
        className="text-xl font-semibold">
        {template.name}
      </h3>
      {/* Metadata of Widget; did not include script, module name, zip_hash */}
      <p className="mb-2 text-sm">
        {template.description || 'No description provided.'}
      </p>
      <ul
        className="text-sm"
        role="list">
        {template.gid && (
          <li role="listitem">
            <strong>GID:</strong> {template.gid}:{template.cid}
          </li>
        )}
        {template.cid && (
          <li role="listitem">
            <strong>CID:</strong> {template.cid}
          </li>
        )}
        {template.version && (
          <li role="listitem">
            <strong>Version:</strong> {template.version || 'N/A'}
          </li>
        )}
        {template.author && (
          <li role="listitem">
            <strong>Author:</strong> {template.author}
          </li>
        )}
        {template.tags && (
          <li role="listitem">
            <strong>Tags:</strong> {template.tags}
          </li>
        )}
      </ul>
    </div>
  );
};

export default TemplateCard;
