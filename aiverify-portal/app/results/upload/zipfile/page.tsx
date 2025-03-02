import Link from 'next/link';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button } from '@/lib/components/button';
import { ButtonVariant } from '@/lib/components/button';
import { ZipFileUploader } from './components/zipFileUploader';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
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
          Upload Test Result Zip File
        </h1>
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
          <Link href="/results/upload/manual">
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
        If you have a zip file containing both your results.json and supporting
        files, use the Zip File Uploader below. <br />
        If you want to manually enter test results and artifacts, use the&nbsp;
        <Link href="/results/upload/manual">
          <span className="text-blue-500 hover:underline">Results Editor</span>
        </Link>
        .
      </p>
      <ZipFileUploader className="mt-12" />
    </main>
  );
}

export default UploadResultsPage;
