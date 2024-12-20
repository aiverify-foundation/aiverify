import { UploaderContainer } from './components/uploaderContainer';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">
        Enter Test Result and Add Supporting Files
      </h1>
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
