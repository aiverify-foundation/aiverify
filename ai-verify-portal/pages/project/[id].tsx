import { GetServerSideProps } from 'next';
import ProjectModule from 'src/modules/project';
import Project, {
  APIConfig,
  ModelAndDatasets,
} from 'src/types/project.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import { getPlugins } from 'server/pluginManager';

import { getProject } from 'server/lib/projectServiceBackend';
import Dataset from 'src/types/dataset.interface';
import ModelFile from 'src/types/model.interface';

type ModuleProps = {
  pluginManager: PluginManagerType;
  data: Project;
  step?: number;
};

export const getServerSideProps: GetServerSideProps = async ({
  params,
  query,
}) => {
  if (!params || !params.id) {
    console.log('url parameter required - id');
    return { notFound: true };
  }

  const id = params.id as string;
  const step = query.step as string;
  const data = await getProject(id);
  const pluginManager = await getPlugins();
  const { __typename, ...modelAndDatasets } =
    data.modelAndDatasets as ModelAndDatasets & {
      __typename: string | undefined;
    };
  if (modelAndDatasets) {
    const { groundTruthDataset, model, testDataset, apiConfig } =
      modelAndDatasets;
    if (groundTruthDataset) {
      const { __typename, ...rest } = groundTruthDataset as Dataset & {
        __typename: string;
      };
      modelAndDatasets.groundTruthDataset = rest;
    }
    if (model) {
      const { __typename, ...rest } = model as ModelFile & {
        __typename: string;
      };
      modelAndDatasets.model = rest;
    }
    if (testDataset) {
      const { __typename, ...rest } = testDataset as Dataset & {
        __typename: string;
      };
      modelAndDatasets.testDataset = rest;
    }

    if (apiConfig) {
      const { __typename, ...rest } = apiConfig as APIConfig & {
        __typename: string;
      };
      modelAndDatasets.apiConfig = rest;
    }
  }

  data.modelAndDatasets = modelAndDatasets;

  const moduleProps: ModuleProps = {
    pluginManager,
    data,
  };

  if (step) {
    const castStep = parseInt(step);
    if (typeof castStep === 'number' && !isNaN(castStep))
      moduleProps.step = castStep;
  }

  return {
    props: moduleProps,
  };
};

type Props = {
  data: Project;
  pluginManager: PluginManagerType;
  step?: number;
};

export default function ProjectUpdatePage({
  data,
  pluginManager,
  step,
}: Props) {
  return (
    <ProjectModule
      data={data}
      pluginManager={pluginManager}
      designStep={step}
    />
  );
}
