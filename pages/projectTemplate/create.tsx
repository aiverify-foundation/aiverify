import { GetServerSideProps } from 'next'
import ProjectTemplateModule from 'src/modules/projectTemplate';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
// import pluginManager from 'server/pluginManager';
import { getPlugins } from 'server/pluginManager';

export const getServerSideProps: GetServerSideProps = async (context) => {
  // console.log("static check", pluginManager)
  const pluginManager = await getPlugins();
  // console.log("pluginManager", pluginManager)
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
  const emptyProjectState: Partial<ProjectTemplate> = { //TODO: 👈 look into correcting type here. 
    projectInfo: {
      name: "",
    },
    pages: [],
    globalVars: [],
  }
  return (<ProjectTemplateModule data={emptyProjectState as ProjectTemplate} pluginManager={pluginManager} />)
}