import { unstable_noStore as noStore } from 'next/cache';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { getTestDatasets } from '@/lib/fetchApis/getTestDatasets';
import { DatasetList } from './components/DatasetList';

export default async function DatasetsPage() {
  noStore();
  const result = await getTestDatasets();
  if ('message' in result) {
    return <div>{result.message}</div>;
  }
  const datasets = result.data;

  return (
    <main className="p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center">
          <Icon
            name={IconName.Lightning}
            size={40}
            color="#FFFFFF"
          />
          <header className="ml-3">
            <h1 className="text-2xl font-bold text-white">Test Datasets</h1>
            <h3 className="text-white">View and manage test datasets</h3>
          </header>
        </div>
      </div>
      <DatasetList
        datasets={datasets}
        className="mt-10"
      />
    </main>
  );
}
