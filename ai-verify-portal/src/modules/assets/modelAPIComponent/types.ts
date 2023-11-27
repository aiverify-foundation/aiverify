import { ModelType } from 'src/types/model.interface';

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export enum AuthType {
  NO_AUTH = 'No Auth',
  BASIC = 'Basic Auth',
  BEARER_TOKEN = 'Bearer Token',
}

export enum MediaType {
  NONE = 'none',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  MULTIPART_FORMDATA = 'multipart/form-data',
  APP_JSON = 'application/json',
  TEXT_PLAIN = 'text/plain',
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
}

export enum OpenApiDataTypes {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

export enum URLParamType {
  PATH = 'Path',
  QUERY = 'Query',
}

export enum BatchStrategy {
  none = 'none',
  multipart = 'multipart',
}

export type SaveResult = {
  id: string;
  name?: string;
  description?: string;
  modelType?: ModelType;
  mode: 'new' | 'update' | 'delete';
};

/*
  Below are types for the (1)API Model Form (formik state), (2)API Model GraphQL response and (3)API Model form submit.
  Using formik, type all inputs except for checkboxes. as `string` at form-level. YUP validation schema is used to validate the string inputs.
  Cast numberic types to string when consuming graphql query response and cast numeric types to number at form submit
*/
export type AdditionalHeader = {
  reactPropId: string;
  name: string;
  type: OpenApiDataTypes;
  value: string;
};

export type UrlParam = {
  reactPropId: string;
  name: string;
  type: OpenApiDataTypes;
};

export type BodyParam = {
  reactPropId: string;
  field: string;
  type: OpenApiDataTypes;
};

/*
 * RequestBody
 * - isArray and maxItems are not read at all by backend(test-engine) openapi schema translater.
 * - leaving them as is on the frontend in case backend wants to support array in request, in the future.
 */
export type RequestBody = {
  mediaType: MediaType;
  isArray: boolean;
  properties: BodyParam[];
};

export type Queries = {
  mediaType: MediaType;
  isArray: boolean;
  name?: string;
  maxItems?: string;
  queryParams: UrlParam[];
};

export type Paths = {
  mediaType: MediaType;
  isArray: boolean;
  name?: string;
  maxItems?: string;
  pathParams: UrlParam[];
};

export type Parameters = {
  paramType: URLParamType;
} & RequireAtLeastOne<{
  queries: Queries;
  paths: Paths;
}>;

export type RequestConfigForm = {
  sslVerify: boolean;
  connectionTimeout: string;
  rateLimit: string;
  rateLimitTimeout: string;
  connectionRetries: string;
  batchStrategy: BatchStrategy;
  batchLimit: string;
  maxConnections: string;
};

export type RequestConfigGQL = {
  sslVerify: boolean;
  connectionTimeout: number;
  rateLimit: number;
  rateLimitTimeout: number;
  connectionRetries: number;
  batchStrategy: BatchStrategy;
  batchLimit: number;
  maxConnections: number;
};

/*
 * The the form state (formik), we use _AIVDATA_ as the name
 * of a property that is dynamic. It should be replaced with the value
 * of 'ResponseForm.field'
 */
export type ResponseSchemaForm = {
  type: OpenApiDataTypes;
  properties?: {
    _AIVDATA_: {
      type: OpenApiDataTypes;
      items?: {
        type: OpenApiDataTypes;
      };
    };
  };
  items?: {
    type: OpenApiDataTypes;
    properties?: {
      _AIVDATA_: {
        type: OpenApiDataTypes;
      };
    };
  };
};

export type ResponseSchemaGQL = {
  type: OpenApiDataTypes;
  properties?: {
    [key: string]: {
      type: OpenApiDataTypes;
      items?: {
        type: OpenApiDataTypes;
      };
    };
  };
  items?: {
    type: OpenApiDataTypes;
    properties?: {
      [key: string]: {
        type: OpenApiDataTypes;
      };
    };
  };
};

export type ResponseForm = {
  statusCode: string;
  mediaType: MediaType;
  schema: ResponseSchemaForm;
  field?: string;
  fieldValueType?: OpenApiDataTypes;
};

export type ResponseGQL = {
  statusCode: number;
  mediaType: MediaType;
  schema: ResponseSchemaGQL;
};

export type AuthTypeConfig = {
  token?: string;
  username?: string;
  password?: string;
};

type FormModelApi = {
  method: RequestMethod;
  url: string;
  urlParams: string;
  authType: AuthType;
  authTypeConfig: { authType?: AuthType } & AuthTypeConfig; // authType is duplicated here because token, user & password are dependent on it and Yup validation schema depdendencies fields have to be siblings
  requestConfig: RequestConfigForm;
  response: ResponseForm;
  additionalHeaders?: AdditionalHeader[];
} & RequireAtLeastOne<{
  requestBody: RequestBody;
  parameters: Parameters;
}>;

type RequestBodyOrParametersGQL = RequireAtLeastOne<{
  requestBody: Omit<RequestBody, 'properties' | 'maxItems'> & {
    maxItems?: number;
    properties: Omit<BodyParam, 'reactPropId'>[];
  };
  parameters: RequireAtLeastOne<{
    queries: Omit<Queries, 'queryParams' | 'maxItems'> & {
      maxItems?: number;
      queryParams: Omit<UrlParam, 'reactPropId'>[];
    };
    paths: Omit<Paths, 'pathParams' | 'maxItems'> & {
      maxItems?: number;
      pathParams: Omit<UrlParam, 'reactPropId'>[];
    };
  }>;
}>;

export type GqlModelApi = {
  method: RequestMethod;
  url: string;
  urlParams?: string;
  authType: AuthType;
  authTypeConfig?: AuthTypeConfig;
  requestConfig: RequestConfigGQL;
  response: ResponseGQL;
  additionalHeaders?: AdditionalHeader[];
} & RequireAtLeastOne<RequestBodyOrParametersGQL>;

/*
  ModelAPIConfig Type used by the Formik controlled form
*/
export type ModelApiFormModel = {
  name: string;
  description: string;
  modelType: ModelType;
  modelAPI: FormModelApi;
};

/*
  ModelAPIConfig Type to conform to for create and update via graphql
  Used to typecheck payload at form submission handler
*/
export type ModelApiGQLModel = {
  id?: string;
  name: string;
  description: string;
  modelType: ModelType;
  modelAPI: Omit<GqlModelApi, 'additionalHeaders'> & {
    additionalHeaders?: Omit<AdditionalHeader, 'reactPropId'>[];
  } & RequireAtLeastOne<RequestBodyOrParametersGQL>;
};

type Typename = {
  __typename: string;
};

/* 
  The ModelAPIConfig payload returned when query via graphql.
  Some response properties could be `null`
*/
export type ModelApiGQLQueryResponseModel = Typename & {
  id: string;
  name: string;
  description: string;
  modelType: ModelType;
  modelAPI: Typename &
    Pick<GqlModelApi, 'method' | 'url' | 'authType'> & {
      urlParams?: string | null;
      authTypeConfig: AuthTypeConfig;
      requestConfig: Typename & RequestConfigGQL;
      response: Typename & ResponseGQL;
      parameters?: {
        queries?:
          | (Typename & {
              mediaType: MediaType;
              isArray: boolean;
              maxItems?: number;
              queryParams: Omit<UrlParam, 'reactPropId'>[];
            })
          | null;
        paths?:
          | (Typename & {
              mediaType: MediaType;
              isArray: boolean;
              maxItems?: number;
              pathParams: Omit<UrlParam, 'reactPropId'>[];
            })
          | null;
      } | null;
      requestBody?:
        | (Typename &
            Omit<RequestBody, 'properties'> & {
              test: number;
              properties: Omit<BodyParam, 'reactPropId'>[];
            })
        | null;
      additionalHeaders?:
        | (Typename & Omit<AdditionalHeader, 'reactPropId'>[])
        | null;
    };
  updatedAt: string;
};

export enum PresetHelpItem {
  POST,
  GET,
  QUERY,
  PATH,
  BASIC_AUTH,
  AUTH_TOKEN,
  NO_AUTH,
  HEADERS,
  RESPONSE,
}

export type PresetOption = {
  value: PresetHelpItem[];
  label: string;
};

export enum PresetGuideSteps {
  MODEL_URL = 'Model URL',
  URL_PARAMS = 'URL Parameters',
  REQUESTBODY_PARAMS = 'Parameters in request data',
  BEARER_TOKEN = 'Bearer Token',
  USER_PASSWORD = 'Username/Password',
  RESPONSE_SETTINGS = 'Response Settings',
}
