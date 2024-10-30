import { fetchEndpoints } from '@/lib/fetchApis/getAllProjects';
import { ProjectCards } from './projectCards';

type ProjectCardsContainerProps = {
  className?: string;
};

export async function ProjectCardsContainer({
  className,
}: ProjectCardsContainerProps) {
  const response = await fetchEndpoints();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const projects = response.data;
  return (
    <section className={className}>
      <ProjectCards projects={projects} />
    </section>
  );
}
