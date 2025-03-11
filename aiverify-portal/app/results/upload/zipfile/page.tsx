'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import LayoutHeader from '@/app/results/components/LayoutHeader';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button } from '@/lib/components/button';
import { ButtonVariant } from '@/lib/components/button';
import { ZipFileUploader } from './components/zipFileUploader';
function UploadResultsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId;
  const router = useRouter();

  const handleBackProject = () => {
    if (isProjectFlow) {
      router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
    }
  };

  return (
    <div className="mt-6 flex h-[calc(100vh-150px)] overflow-y-auto rounded-2xl bg-secondary-950 pt-6 text-white">
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackProject}
      />
      <main className="mx-auto h-full w-full pb-6 pl-6 pr-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between">
            {!isProjectFlow && (
              <Link
                href="/results"
                className="mr-2">
                <Icon
                  name={IconName.ArrowLeft}
                  size={25}
                  color="currentColor"
                />
              </Link>
            )}
            <h1 className="my-6 text-2xl font-bold tracking-wide">
              Upload Test Result Zip File
            </h1>
          </div>

          <div className="flex items-center">
            <Button
              pill
              textColor="white"
              variant={ButtonVariant.OUTLINE}
              size="sm"
              text="Upload Zip File"
              className="!rounded-r-none rounded-l-full"
              disabled
            />
            <Link
              href={`/results/upload/manual${isProjectFlow ? `?projectId=${projectId}` : ''}`}>
              <Button
                pill
                textColor="white"
                variant={ButtonVariant.OUTLINE}
                size="sm"
                text="Results Editor"
                className="!rounded-l-none rounded-r-full"
              />
            </Link>
          </div>
        </div>
        <p className="mb-4">
          If you have a zip file containing both your results.json and
          supporting files, use the Zip File Uploader below. <br />
          If you want to manually enter test results and artifacts, use
          the&nbsp;
          <Link
            href={`/results/upload/manual${isProjectFlow ? `?projectId=${projectId}` : ''}`}>
            <span className="text-blue-500 hover:underline">
              Results Editor
            </span>
          </Link>
          .
        </p>
        <ZipFileUploader className="mt-12" />
      </main>
    </div>
  );
}

export default UploadResultsPage;
