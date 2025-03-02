import Link from 'next/link';
import { IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
import { UploaderContainer } from './components/uploaderContainer';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full overflow-y-auto px-6 scrollbar-hidden">
      <Link
        href="/results"
        className="mt-4 inline-block">
        <Button
          variant={ButtonVariant.OUTLINE}
          size="sm"
          text="Back to Results"
          icon={IconName.ArrowLeft}
          iconPosition="left"
          textColor="white"
        />
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="my-6 text-2xl font-bold tracking-wide">
          Enter Test Result and Add Supporting Files
        </h1>
        <div className="flex items-center">
          <Link href="/results/upload/zipfile">
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
  );
}

export default UploadResultsPage;
