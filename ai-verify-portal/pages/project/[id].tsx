import { GetServerSideProps } from 'next'
import ProjectModule from 'src/modules/project';
import Project, { ModelAndDatasets } from 'src/types/project.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import { getPlugins } from 'server/pluginManager';

import { getProject } from 'server/lib/projectServiceBackend';
import Dataset from 'src/types/dataset.interface';
import ModelFile from 'src/types/model.interface';

export const getServerSideProps: GetServerSideProps = async ({params}) => {
  if (!params || !params.id) {
    console.log('url parameter required - id');
    return { notFound: true };
  }

  const id = params.id as string;
  const data = await getProject(id)
  const pluginManager = await getPlugins();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __typename, ...modelAndDatasets } = data.modelAndDatasets as ModelAndDatasets & { __typename: string | undefined };
  if (modelAndDatasets) {
    const { groundTruthDataset, model, testDataset } = modelAndDatasets;
    if (groundTruthDataset) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __typename, ...rest } = groundTruthDataset as Dataset & { __typename: string };
      modelAndDatasets.groundTruthDataset = rest;
    }
    if (model) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __typename, ...rest } = model as ModelFile & { __typename: string };
      modelAndDatasets.model = rest;
    }
    if (testDataset) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __typename, ...rest } = testDataset as Dataset & { __typename: string };
      modelAndDatasets.testDataset = rest
    }
  }

  data.modelAndDatasets = modelAndDatasets;

  return {
    props: {
      pluginManager,
      data
    },
  }
}

type Props = {
  data: Project,
  pluginManager: PluginManagerType
}

export default function ProjectUpdatePage({data, pluginManager}: Props) {
  return (<ProjectModule data={data} pluginManager={pluginManager} />)
}