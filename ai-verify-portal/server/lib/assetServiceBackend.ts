import { gql } from '@apollo/client';
import graphqlClient from 'src/lib/graphqlClient';

import Dataset from 'src/types/dataset.interface';
import ModelFile from 'src/types/model.interface';

export const GET_DATASETS = gql`
  query Query {
    datasets {
      id
      name
      ctime
      size
      status
      dataColumns {
        id
        name
        datatype
        label
      }
      serializer
      dataFormat
      errorMessages
    }
  }
`;

export async function listDatasets(): Promise<Dataset[]> {
  const client = graphqlClient(true);
  const { data } = await client.query({
    query: GET_DATASETS,
  });

  const datasets = data.datasets as Dataset[];

  return datasets;
}

export const GET_MODELS = gql`
  query Query {
    modelFiles {
      id
      name
      ctime
      size
      status
      serializer
      modelFormat
      errorMessages
    }
  }
`;

export async function listModels(): Promise<ModelFile[]> {
  const client = graphqlClient(true);
  const { data } = await client.query({
    query: GET_MODELS,
  });

  const modelFiles = data.modelFiles as ModelFile[];

  return modelFiles;
}
