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

export type RequestBody = {
  mediaType: MediaType;
  isArray: boolean;
  properties: BodyParam[];
};

export type Queries = {
  mediaType: MediaType;
  isArray: boolean;
  queryParams: UrlParam[];
};

export type Paths = {
  mediaType: MediaType;
  isArray: boolean;
  pathParams: UrlParam[];
};

interface BaseParameters {
  queries: Queries;
  paths: Paths;
}

export type Parameters = RequireAtLeastOne<BaseParameters>;

export type RequestConfig = {
  rateLimit: number;
  batchStrategy: BatchStrategy;
  batchLimit: number;
  maxConnections: number;
  requestTimeout: number;
};

export type Response = {
  statusCode: number;
  mediaType: MediaType;
  type: OpenApiDataTypes;
  field: string;
};

export type AuthBearerTokenConfig = {
  token: string;
};

export type AuthBasicConfig = {
  username: string;
  password: string;
};

export type ModelAPI = {
  method: RequestMethod;
  url: string;
  urlParams?: string;
  authType: AuthType;
  authTypeConfig?: AuthBearerTokenConfig | AuthBasicConfig;
  requestBody: RequestBody;
  requestConfig: RequestConfig;
  response: Response;
  parameters: Parameters;
  additionalHeaders?: AdditionalHeader[];
};

export type ConfigDescription = {
  name: string;
  description: string;
  modelType: ModelType;
};

export type ModelAPIFormModel = ConfigDescription & {
  modelAPI: ModelAPI;
};

interface RequestBodyOrParametersForGraphQL {
  requestBody: Pick<RequestBody, 'mediaType' | 'isArray'> & {
    properties: Pick<BodyParam, 'field' | 'type'>[];
  };
  parameters: RequireAtLeastOne<{
    queries: {
      queryParams: Pick<UrlParam, 'name' | 'type'>[];
    };
    paths: {
      pathParams: Pick<UrlParam, 'name' | 'type'>[];
    };
  }>;
}

export type ModelAPIGraphQLModel = ConfigDescription & {
  modelAPI: Pick<
    ModelAPI,
    | 'method'
    | 'url'
    | 'urlParams'
    | 'authType'
    | 'authTypeConfig'
    | 'requestConfig'
    | 'response'
  > &
    RequireAtLeastOne<RequestBodyOrParametersForGraphQL> & {
      additionalHeaders?: Pick<AdditionalHeader, 'name' | 'type' | 'value'>[];
    };
};
