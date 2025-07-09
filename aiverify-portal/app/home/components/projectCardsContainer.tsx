import { getProjects } from '@/lib/fetchApis/getProjects';
import { ProjectSearchProvider } from './ProjectSearchProvider';
import { ProjectsFilters } from './projectFilters';
import { FilteredProjectCards } from './FilteredProjectCards';

type ProjectCardsContainerProps = {
  className?: string;
};

export async function ProjectCardsContainer({
  className,
}: ProjectCardsContainerProps) {
  const response = await getProjects();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const projects = response.data;
  
  return (
    <ProjectSearchProvider initialProjects={projects}>
      <ProjectsFilters projects={projects} className="my-6 mt-[100px]" />
      <section className={className} data-testid="project-cards-container">
        <FilteredProjectCards />
      </section>
    </ProjectSearchProvider>
  );
}
