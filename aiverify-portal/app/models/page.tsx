import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from '@/app/models/components/ActionButtons';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import ModelList from '@/app/models/components/ModelList';

export default async function ModelsPage() {
  const models = await getTestModels();

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon
            name={IconName.Document}
            size={40}
            color="#FFFFFF"
          />
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
