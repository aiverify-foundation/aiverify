import { Uploads } from './components/uploads';

function UploadResultsPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">Upload Results</h1>
      <p className="mb-4">
        Add the test result in the editor below. It should be in JSON format.
        <br />
        To add test artifacts, use the &apos;Add Test Artifacts&apos; tool on
        the right.
      </p>
      <Uploads className="mt-8" />
    </main>
  );
}

export default UploadResultsPage;
