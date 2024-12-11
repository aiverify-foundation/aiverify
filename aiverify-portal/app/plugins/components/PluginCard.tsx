import { Plugin } from '../../types';
import { Card } from '@/lib/components/card/card';

type Props = {
  plugin: Plugin;
};

export default function PluginCard({ plugin }: Props) {
  return (
    <Card
      size="md"
      className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 w-full"
      style={{
        border: '1px solid var(--color-secondary-300)',
        borderRadius: '0.5rem',
        padding: '1rem',
        width: '100%',
        height: 'auto'
      }}
      cardColor="var(--color-secondary-950)"
      enableTiltEffect={false}
    >
      <Card.Content className="h-auto">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">{plugin.name}</h3>

        {/* Metadata and Tags */}
        <div className="flex items-start space-x-70 gap-4">
          {/* Metadata */}
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            <div>
              <span className="font-semibold text-white">Version:</span> {plugin.version}
            </div>
            <div>
              <span className="font-semibold text-white">Author:</span> {plugin.author}
            </div>
            <div>
              <span className="font-semibold text-white">Installed on:</span>{' '}
              {new Date(plugin.updated_at).toLocaleString('en-GB')}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {plugin.widgets.length > 0 && (
              <span className="bg-white text-secondary-950 px-2 py-1 rounded text-sm">
                widgets: {plugin.widgets.length}
              </span>
            )}
            {plugin.algorithms.length > 0 && (
              <span className="bg-white text-secondary-950 px-2 py-1 rounded text-sm">
                algorithms: {plugin.algorithms.length}
              </span>
            )}
            {plugin.input_blocks.length > 0 && (
              <span className="bg-white text-secondary-950 px-2 py-1 rounded text-sm">
                input blocks: {plugin.input_blocks.length}
              </span>
            )}
            {plugin.templates.length > 0 && (
              <span className="bg-white text-secondary-950 px-2 py-1 rounded text-sm">
                templates: {plugin.templates.length}
              </span>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
