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
