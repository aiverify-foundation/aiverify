import HomeModule from 'src/modules/home';
import { listProjects } from 'server/lib/projectServiceBackend';
import Project from 'src/types/project.interface';

export async function getServerSideProps() {
  const projects = await listProjects();
  return {
    props: {
      projects: projects,
    },
  };
}

type Props = {
  projects: Project[];
};

/**
 * Home page
 */
export default function HomePage({ projects }: Props) {
  return <HomeModule projects={projects} />;
}
