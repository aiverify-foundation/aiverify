import { ModelType } from 'src/types/model.interface';
import {
  AuthType,
  BatchStrategy,
  MediaType,
  ModelApiFormModel,
  OpenApiDataTypes,
  RequestMethod,
  URLParamType,
} from './types';

export const ConnectionSettingUnlimited = '-1';

export const defaultFormValues: ModelApiFormModel = {
  name: '',
  description: '',
  modelType: ModelType.Classification,
  modelAPI: {
    url: '',
    urlParams: '',
    method: RequestMethod.POST,
    authType: AuthType.NO_AUTH,
    requestBody: {
      mediaType: MediaType.FORM_URLENCODED,
      isArray: false,
      maxItems: '100',
      name: 'data',
      properties: [],
    },
    parameters: {
      paramType: URLParamType.QUERY,
      paths: {
        mediaType: MediaType.NONE,
        isArray: false,
        name: 'data',
        maxItems: '100',
        pathParams: [],
      },
      queries: {
        mediaType: MediaType.NONE,
        isArray: false,
        name: 'data',
        maxItems: '100',
        queryParams: [],
      },
    },
    requestConfig: {
      rateLimit: ConnectionSettingUnlimited,
      batchStrategy: BatchStrategy.none,
      batchLimit: ConnectionSettingUnlimited,
      maxConnections: ConnectionSettingUnlimited,
      connectionTimeout: ConnectionSettingUnlimited,
      sslVerify: false,
      rateLimitTimeout: ConnectionSettingUnlimited,
      connectionRetries: '3',
    },
    response: {
      statusCode: '200',
      mediaType: MediaType.TEXT_PLAIN,
      schema: {
        type: OpenApiDataTypes.INTEGER,
        items: {
          type: OpenApiDataTypes.INTEGER,
          properties: {
            data: {
              type: OpenApiDataTypes.INTEGER,
            },
          },
        },
      },
      field: 'data',
      fieldValueType: OpenApiDataTypes.INTEGER,
    },
    authTypeConfig: {
      authType: AuthType.NO_AUTH, // authType is duplicated here in Form Model to allow easy Yup validation dependency rules. Remove in gql request.
      token: '',
      username: '',
      password: '',
    },
  },
};
