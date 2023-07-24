import { gql } from '@apollo/client';

export const GQL_CREATE_MODELAPI = gql`
  mutation ($model: ModelAPIInput!) {
    createModelAPI(model: $model) {
      name
      description
      modelType
      modelApi {
        url
        method
        authType
        authTypeConfig
        requestBody {
          isArray
          mediaType
          properties {
            field
            type
          }
        }
        requestConfig {
          rateLimit
          batchStrategy
          batchLimit
          maxConnections
          requestTimeout
        }
        response {
          statusCode
          mediaType
          type
          field
        }
      }
    }
  }
`;
