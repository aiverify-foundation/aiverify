import { GetServerSideProps } from 'next'
import ProjectTemplateModule from 'src/modules/projectTemplate';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import { getPlugins } from 'server/pluginManager';

export const getServerSideProps: GetServerSideProps = async () => {
  const pluginManager = await getPlugins();
  return {
    props: {
      pluginManager
    },
  }
}

type Props = {
  pluginManager: PluginManagerType
}

export default function ProjectTemplateCreatePage({ pluginManager }: Props) {
  const emptyProjectState: Partial<ProjectTemplate> = {
    projectInfo: {
      name: "",
    },
    pages: [],
    globalVars: [],
  }
  return (<ProjectTemplateModule data={emptyProjectState as ProjectTemplate} pluginManager={pluginManager} />)
}