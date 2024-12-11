import { ZipFileUploader } from './components/zipFileUploader';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">
        Upload Test Result Zip File
      </h1>
      <p className="mb-4">
        If you have a zip file containing both your results.json and supporting
        files, use the Zip File Uploader below
      </p>
      <ZipFileUploader className="mt-12" />
    </main>
  );
}

export default UploadResultsPage;
