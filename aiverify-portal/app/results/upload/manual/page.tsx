'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import LayoutHeader from '@/app/results/components/LayoutHeader';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
import { UploaderContainer } from './components/uploaderContainer';

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
    <div className="mt-6 flex h-[calc(100vh-100px)] overflow-y-auto rounded-2xl bg-secondary-950 text-white">
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackProject}
      />
      <main className="mx-auto h-full w-full pb-6 pl-6 pr-6 scrollbar-hidden">
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
              Enter Test Result and Add Supporting Files
            </h1>
          </div>

          <div className="flex items-center">
            <Link
              href={`/results/upload/zipfile${isProjectFlow ? `?projectId=${projectId}` : ''}`}>
              <Button
                pill
                textColor="white"
                variant={ButtonVariant.OUTLINE}
                size="sm"
                text="Upload Zip File"
                className="!rounded-r-none rounded-l-full"
              />
            </Link>

            <Button
              pill
              textColor="white"
              variant={ButtonVariant.OUTLINE}
              size="sm"
              text="Results Editor"
              className="!rounded-l-none rounded-r-full"
              disabled
            />
          </div>
        </div>
        <p className="mb-4">
          Enter your test result in JSON format in the editor below.
          <br />
          Use the &apos;Add Test Artifacts&apos; tool to include any supporting
          files with your test results
        </p>
        <UploaderContainer className="mt-8" />
      </main>
    </div>
  );
}

export default UploadResultsPage;
