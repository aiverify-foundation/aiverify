import { Plugin } from '../../types';
import { Card } from '@/lib/components/card/card';

type Props = {
  plugin: Plugin;
};

export default function PluginCard({ plugin }: Props) {
  // const fileName = result.testArguments.modelFile.substring(result.testArguments.modelFile.lastIndexOf('/') + 1);
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
        <h3 className="text-lg font-semibold text-white mb-2">{plugin.name}</h3>
        <div className=" sm:grid-cols-3 gap-y-2 text-sm text-gray-400">
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
      </Card.Content>
    </Card>
  );
}
