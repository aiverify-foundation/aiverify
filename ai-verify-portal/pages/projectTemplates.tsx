import { listProjectTemplates } from 'server/lib/projectServiceBackend';
import TemplateListModule from 'src/modules/projectTemplate/templateListModule';
import ProjectTemplate from 'src/types/projectTemplate.interface';

export async function getServerSideProps() {
  const templates = await listProjectTemplates();
  return {
    props: {
      templates,
    },
  };
}

type Props = {
  templates: ProjectTemplate[];
};

export default function ProjectTemplateListPage({ templates }: Props) {
  return <TemplateListModule templates={templates} />;
}
