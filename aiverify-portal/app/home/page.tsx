import { UserFlowCards } from './components/userFlowCards';
import { ProjectsFilters } from './components/projectFilters';
import { ProjectCardsContainer } from './components/projectCardsContainer';
import { Suspense } from 'react';
import { ProjectCardsLoading } from './components/projectCardsLoading';

export default async function HomePage() {
  return (
    <main className="w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">
        Welcome, what would you like to do today?
      </h1>
      <UserFlowCards />
      <ProjectsFilters className="my-6 mt-[100px]" />
      <Suspense
        fallback={<ProjectCardsLoading className="flex flex-wrap gap-6" />}>
        <ProjectCardsContainer className="flex flex-wrap gap-6" />
      </Suspense>
    </main>
  );
}
