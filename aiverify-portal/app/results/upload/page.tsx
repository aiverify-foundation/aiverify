import { UploaderContainer } from './components/uploaderContainer';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">Upload Results</h1>
      <p className="mb-4">
        Enter the test result in the editor below. It should be in JSON format.
        <br />
        To add test artifacts, use the &apos;Add Test Artifacts&apos; tool on
        the right.
      </p>
      <UploaderContainer className="mt-8" />
    </main>
  );
}

export default UploadResultsPage;
