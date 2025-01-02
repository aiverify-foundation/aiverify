import { Icon, IconName } from '@/lib/components/IconSVG';
import { getTestDatasets } from '@/lib/fetchApis/getTestDatasets';

export default async function DatasetsPage() {
  // const datasets = await getTestDatasets();

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon
            name={IconName.Lightning}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Test Datasets</h1>
            <h3 className="text-white">View and manage test datasets</h3>
          </div>
        </div>

      </div>
    </div>
  );
}
