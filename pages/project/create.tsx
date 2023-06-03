import { GetServerSideProps } from 'next'
import ProjectModule from 'src/modules/project';
import Project from 'src/types/project.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import { getPlugins } from 'server/pluginManager';

export const getServerSideProps: GetServerSideProps = async (context) => {
  // console.log("static check", pluginManager)
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

export default function ProjectCreatePage({ pluginManager }: Props) {
  const emptyProjectState: Partial<Project> = { // TODO: 👈 look into correcting type check here
    projectInfo: {
      name: "",
    },
    pages: [],
    inputBlocks: [],
    globalVars: [],
  }
  return (<ProjectModule data={emptyProjectState as Project} pluginManager={pluginManager} />)
}