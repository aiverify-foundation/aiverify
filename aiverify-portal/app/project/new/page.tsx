import { NewProjectForm } from './components/newProjectForm';

function NewProjectPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="mt-6 text-2xl font-bold tracking-wide">
        Create a new AI testing project
      </h1>
      <p className="text-secondary-300">
        Create a new AI Testing Project to design the tests to be run on the AI
        Model and document the test results in the report generated
      </p>
      <section className="mt-[100px] flex w-full items-center justify-center">
        <div className="flex w-[800px] gap-4 rounded-md bg-secondary-1000 p-4">
          <div className="w-[40%]">
            <h2 className="text-[1.2rem] font-bold tracking-wide">
              General Information
            </h2>
            <p className="text-[0.9rem] text-secondary-400">
              Provide general information required for the report generation
            </p>
          </div>
          <div className="h-auto w-[1px] bg-white opacity-20" />
          <NewProjectForm />
        </div>
      </section>
    </main>
  );
}

export default NewProjectPage;
