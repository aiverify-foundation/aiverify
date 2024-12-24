import React from 'react';
import { Template } from '@/app/plugins/utils/types';

type TemplatesProps = {
    template: Template;
};

const TemplateCard: React.FC<TemplatesProps> = ({ template }) => {

    return (
        <div className="bg-secondary-800 border border-secondary-300 p-6 rounded-lg mb-8" >
            <h3 className='font-semibold text-xl'>{template.name}</h3>
            {/* Metadata of Widget; did not include script, module name, zip_hash */}
            <p className='text-sm mb-2'>{template.description || "No description provided."}</p>
            <ul className="text-sm">
                {template.gid && (
                    <li>
                    <strong>GID:</strong> {template.gid}:{template.cid}
                    </li>
                )}
                {template.cid && (
                    <li>
                    <strong>CID:</strong> {template.cid}
                    </li>
                )}
                {template.version && (
                    <li>
                    <strong>Version:</strong> {template.version || "N/A"}
                    </li>
                )}
                {template.author && (
                    <li>
                        <strong>Author:</strong> {template.author}
                    </li>
                )}
                {template.tags && (
                    <li>
                        <strong>Tags:</strong> {template.tags}
                    </li>
                )}
            </ul>
        </div>

    );
};

export default TemplateCard;