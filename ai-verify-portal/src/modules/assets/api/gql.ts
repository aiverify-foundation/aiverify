import { gql } from '@apollo/client';

export const GQL_CREATE_MODELAPI = gql`
  mutation ($model: ModelAPIInput!) {
    createModelAPI(model: $model) {
      id
      name
      description
      type
      status
      modelType
      modelAPI {
        url
        urlParams
        additionalHeaders {
          name
          type
          value
        }
        authType
        authTypeConfig
        method
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

export type GqlCreateModelAPIConfigResult = {
  createModelAPI: { id: string; name: string; description: string };
};
