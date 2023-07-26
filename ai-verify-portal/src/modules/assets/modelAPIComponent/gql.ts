import { gql } from '@apollo/client';
import { ModelType } from 'src/types/model.interface';

export const GQL_CREATE_MODELAPI = gql`
  mutation ($model: ModelAPIInput!) {
    createModelAPI(model: $model) {
      id
      name
      description
      modelType
    }
  }
`;

export type GqlCreateModelAPIConfigResult = {
  createModelAPI: {
    id: string;
    name: string;
    description: string;
    modelType: ModelType;
  };
};

export const GQL_UPDATE_MODELAPI = gql`
  mutation Mutation($modelFileId: ObjectID!, $model: ModelAPIInput!) {
    updateModelAPI(modelFileID: $modelFileId, model: $model) {
      id
      name
      description
      modelType
    }
  }
`;

export type GqlUpdateModelAPIConfigResult = {
  updateModelAPI: {
    id: string;
    name: string;
    description: string;
    modelType: ModelType;
  };
};
