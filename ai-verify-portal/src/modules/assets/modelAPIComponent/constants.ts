import { ModelType } from 'src/types/model.interface';
import {
  AuthType,
  BatchStrategy,
  MediaType,
  ModelAPIFormModel,
  OpenApiDataTypes,
  RequestMethod,
} from './types';

export const defaultFormValues: ModelAPIFormModel = {
  name: '',
  description: '',
  modelType: ModelType.Classification,
  modelAPI: {
    url: '',
    urlParams: '',
    method: RequestMethod.POST,
    authType: AuthType.NO_AUTH,
    requestBody: {
      mediaType: MediaType.NONE,
      isArray: false,
      properties: [],
    },
    parameters: {
      queries: {
        mediaType: MediaType.NONE,
        isArray: false,
        queryParams: [],
      },
    },
    requestConfig: {
      rateLimit: -1,
      batchStrategy: BatchStrategy.none,
      batchLimit: -1,
      maxConnections: -1,
      requestTimeout: 60000,
    },
    response: {
      statusCode: 200,
      mediaType: MediaType.APP_JSON,
      type: OpenApiDataTypes.INTEGER,
      field: 'data',
    },
    authTypeConfig: {
      authType: AuthType.NO_AUTH, // authType is duplicated here in Form Model to allow easy Yup validation dependency rules. Remove in gql request.
      token: '',
      username: '',
      password: '',
    },
  },
};
