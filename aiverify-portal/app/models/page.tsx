import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from '@/app/models/components/ActionButtons';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import ModelList from '@/app/models/components/ModelList';
import { DataGrid } from './components/DataGrid';

export default async function PluginsPage() {
  const models = await getTestModels();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon name={IconName.Document} size={40} color="#FFFFFF" />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Models</h1>
            <h3 className="text-white">View and manage test models</h3>
          </div>
        </div>

        <ActionButtons />
      </div>
      <ModelList models={models} />
    </div>
  );
}