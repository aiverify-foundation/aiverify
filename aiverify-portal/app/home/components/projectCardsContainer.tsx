import { getProjects } from '@/lib/fetchApis/getProjects';
import { ProjectCards } from './projectCards';

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
    <section className={className}>
      <ProjectCards projects={projects} />
    </section>
  );
}
