import { GetServerSideProps } from 'next';

import ProjectTemplateModule from 'src/modules/projectTemplate';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import { getPlugins } from 'server/pluginManager';

import { getProjectTemplate } from 'server/lib/projectServiceBackend';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  if (!params || !params.id) {
    console.log('url parameter required - id');
    return { notFound: true };
  }

  const id = params.id as string;
  const data = await getProjectTemplate(id);
  const pluginManager = await getPlugins();
  return {
    props: {
      pluginManager,
      data,
    },
  };
};

type Props = {
  data: ProjectTemplate;
  pluginManager: PluginManagerType;
};

export default function ProjectUpdatePage({ data, pluginManager }: Props) {
  return <ProjectTemplateModule data={data} pluginManager={pluginManager} />;
}
