import Link from 'next/link';
import { DatasetUploader } from './components/datasetUploader';
import { Button } from '@/lib/components/button';
import { ButtonVariant } from '@/lib/components/button';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
      <div className="flex items-center justify-between">
        <h1 className="my-6 text-2xl font-bold tracking-wide">
          Add New Datasets
        </h1>
      </div>
      <DatasetUploader className="mt-12" />
    </main>
  );
}

export default UploadResultsPage;
