import { Plugin } from '@/app/plugins/utils/types';
import { Card } from '@/lib/components/card/card';

type Props = {
  plugin: Plugin;
};

export default function PluginCard({ plugin }: Props) {
  return (
    <Card
      size="md"
      className="mb-4 w-full shadow-md transition-shadow duration-200 hover:shadow-lg"
      style={{
        border: '1px solid var(--color-secondary-300)',
        borderRadius: '0.5rem',
        padding: '1rem',
        width: '100%',
        height: 'auto',
      }}
      cardColor="var(--color-secondary-950)"
      enableTiltEffect={false}
      aria-label={`Plugin card for ${plugin.name}`}>
      <Card.Content className="h-auto">
        {/* Title */}
        <h3
          className="mb-2 text-lg font-semibold text-white"
          role="heading"
          aria-level={3}>
          {plugin.name}
        </h3>

        {/* Metadata and Tags */}
        <div className="space-x-70 flex items-start gap-4">
          {/* Metadata */}
          <div
            className="flex flex-col gap-2 text-sm text-gray-400"
            role="group"
            aria-label="Plugin metadata">
            <div>
              <span
                className="font-semibold text-white"
                aria-label={`Version ${plugin.version}`}>
                Version:
              </span>{' '}
              {plugin.version}
            </div>
            <div>
              <span
                className="font-semibold text-white"
                aria-label={`Author ${plugin.author}`}>
                Author:
              </span>{' '}
              {plugin.author}
            </div>
            <div>
              <span
                className="font-semibold text-white"
                aria-label={`Installed on ${new Date(plugin.updated_at + "Z").toLocaleString('en-GB')}`}>
                Installed on:
              </span>{' '}
              {new Date(plugin.updated_at + "Z").toLocaleString('en-GB')}
            </div>
          </div>

          {/* Tags */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Plugin tags">
            {plugin.widgets.length > 0 && (
              <span
                className="rounded bg-white px-2 py-1 text-sm text-secondary-950"
                role="status"
                aria-label={`Widgets count: ${plugin.widgets.length}`}>
                widgets: {plugin.widgets.length}
              </span>
            )}
            {plugin.algorithms.length > 0 && (
              <span
                className="rounded bg-white px-2 py-1 text-sm text-secondary-950"
                role="status"
                aria-label={`Algorithms count: ${plugin.algorithms.length}`}>
                algorithms: {plugin.algorithms.length}
              </span>
            )}
            {plugin.input_blocks.length > 0 && (
              <span
                className="rounded bg-white px-2 py-1 text-sm text-secondary-950"
                role="status"
                aria-label={`Input blocks count: ${plugin.input_blocks.length}`}>
                input blocks: {plugin.input_blocks.length}
              </span>
            )}
            {plugin.templates.length > 0 && (
              <span
                className="rounded bg-white px-2 py-1 text-sm text-secondary-950"
                role="status"
                aria-label={`Templates count: ${plugin.templates.length}`}>
                templates: {plugin.templates.length}
              </span>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
