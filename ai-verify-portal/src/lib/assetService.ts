import { gql, useMutation } from '@apollo/client';
import graphqlClient from './graphqlClient';

import Dataset from 'src/types/dataset.interface';
import ModelFile from 'src/types/model.interface';

export const DELETE_DATASET = gql`
  mutation Mutation($id: ObjectID!) {
    deleteDataset(id: $id)
  }
`;

/**
 * Send apollo mutation to delete a Dataset.
 * @param id Dataset ID
 * @returns Promise with deleted Dataset ID
 */
type deleteDatasetFunction = (id: string) => Promise<string>;
export const useDeleteDataset = (): deleteDatasetFunction => {
  const [deleteDataset] = useMutation(DELETE_DATASET);
  const fn = (id: string): Promise<string> => {
    return new Promise((resolve) => {
      deleteDataset({
        variables: {
          id,
        },
        onCompleted: (data) => resolve(data.deleteDataset),
        onError: (error) => resolve(error.graphQLErrors[0].message),
      });
    });
  };
  return fn;
};

export const DELETE_MODEL_FILE = gql`
  mutation Mutation($id: ObjectID!) {
    deleteModelFile(id: $id)
  }
`;

/**
 * Send apollo mutation to delete a ModelFile.
 * @param id ModelFile ID
 * @returns Promise with deleted ModelFile ID
 */
type deleteModelFileFunction = (id: string) => Promise<string>;
export const useDeleteModelFile = (): deleteModelFileFunction => {
  const [deleteModelFile] = useMutation(DELETE_MODEL_FILE);
  const fn = (id: string): Promise<string> => {
    return new Promise((resolve) => {
      deleteModelFile({
        variables: {
          id,
        },
        onCompleted: (data) => resolve(data.deleteModelFile),
        onError: (error) => resolve(error.graphQLErrors[0].message),
      });
    });
  };
  return fn;
};

export const UPDATE_MODEL = gql`
  mutation ($modelFileID: ObjectID!, $modelFile: ModelFileInput) {
    updateModel(modelFileID: $modelFileID, modelFile: $modelFile) {
      name
    }
  }
`;

/**
 * Send apollo mutation to validate dataset
 * @param modelFileID modelFileID, should change to modelID after integrating API models
 * @returns Promise with returned modelFile
 */
type UpdateModelFunction = (
  modelFileID: string,
  modelFile: Partial<ModelFile>
) => Promise<string>;
export const useUpdateModel = (): UpdateModelFunction => {
  const [updateModel] = useMutation(UPDATE_MODEL);
  const fn = (
    modelFileID: string,
    modelFile: Partial<ModelFile>
  ): Promise<string> => {
    return new Promise((resolve) => {
      updateModel({
        variables: {
          modelFileID,
          modelFile,
        },
        onCompleted: (data) => resolve(data.updateModel),
        onError: (error) => resolve(error.graphQLErrors[0].message),
      });
    });
  };
  return fn;
};

export const UPDATE_DATASET = gql`
  mutation ($datasetID: ObjectID!, $dataset: DatasetInput) {
    updateDataset(datasetID: $datasetID, dataset: $dataset) {
      name
    }
  }
`;

/**
 * Send apollo mutation to validate dataset
 * @param datasetID datasetID,
 * @returns Promise with returned dataset
 */
type UpdateDatasetFunction = (
  datasetID: string,
  dataset: Partial<Dataset>
) => Promise<string>;
export const useUpdateDataset = (): UpdateDatasetFunction => {
  const [updateDataset] = useMutation(UPDATE_DATASET);
  const fn = (
    datasetID: string,
    dataset: Partial<Dataset>
  ): Promise<string> => {
    return new Promise((resolve) => {
      updateDataset({
        variables: {
          datasetID,
          dataset,
        },
        onCompleted: (data) => resolve(data.updateDataset),
        onError: (error) => resolve(error.graphQLErrors[0].message),
      });
    });
  };
  return fn;
};

/**
 * Get list of datasets
 */
export const GET_DATASETS = gql`
  query Query {
    datasets {
      id
      name
      filename
      filePath
      ctime
      size
      status
      dataColumns {
        name
        datatype
        label
      }
      serializer
      dataFormat
    }
  }
`;

export const getDatasets = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await graphqlClient().query({
        query: GET_DATASETS,
      });
      resolve(data.datasets);
    } catch (err) {
      reject(err);
    }
  });
};
