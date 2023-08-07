import { gql } from '@apollo/client';
import { toErrorWithMessage } from 'src/lib/errorUtils';
import graphqlClient from 'src/lib/graphqlClient';
import { ModelAPIGraphQLQueryResponseModel } from 'src/modules/assets/modelAPIComponent/types';

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

const GQL_GET_MODELAPI = gql`
  query ModelFiles($modelFileID: ObjectID) {
    modelFiles(modelFileID: $modelFileID) {
      id
      name
      description
      updatedAt
      modelType
      modelAPI {
        method
        url
        urlParams
        authType
        authTypeConfig
        additionalHeaders {
          name
          type
          value
        }
        parameters {
          paths {
            mediaType
            isArray
            maxItems
            pathParams {
              name
              type
            }
          }
          queries {
            mediaType
            name
            isArray
            maxItems
            queryParams {
              name
              type
            }
          }
        }
        requestBody {
          mediaType
          isArray
          name
          maxItems
          properties {
            field
            type
          }
        }
        response {
          statusCode
          mediaType
          type
          field
        }
        requestConfig {
          sslVerify
          connectionTimeout
          rateLimit
          rateLimitTimeout
          batchLimit
          connectionRetries
          maxConnections
          batchStrategy
        }
      }
    }
  }
`;

export async function getModelAPIConfig(
  modelFileID: string
): Promise<ModelAPIGraphQLQueryResponseModel | undefined> {
  const client = graphqlClient(true);
  try {
    const { data } = await client.query<{
      modelFiles: ModelAPIGraphQLQueryResponseModel[];
    }>({
      query: GQL_GET_MODELAPI,
      variables: {
        modelFileID,
      },
    });
    if (data.modelFiles && data.modelFiles.length === 1) {
      return data.modelFiles[0];
    }
  } catch (err) {
    console.log(toErrorWithMessage(err));
    return undefined;
  }
  return undefined;
}
