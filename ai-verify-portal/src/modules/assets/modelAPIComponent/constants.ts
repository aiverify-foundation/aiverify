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
    /*
     * RequestBody
     * - isArray and maxItems are not read at all by backend(test-engine) openapi schema translater.
     * - leaving isArray as false by default. It is not set to true by any UI controls on the form.
     * - Not removing from here in case backend wants to support it in the future
     */
    requestBody: {
      mediaType: MediaType.FORM_URLENCODED,
      isArray: false,
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
        properties: {
          _AIVDATA_: {
            type: OpenApiDataTypes.ARRAY,
            items: {
              type: OpenApiDataTypes.INTEGER,
            },
          },
        },
        items: {
          type: OpenApiDataTypes.INTEGER,
          properties: {
            _AIVDATA_: {
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
