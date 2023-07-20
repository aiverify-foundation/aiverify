import { ModelType } from 'src/types/model.interface';

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

export type AdditionalHeader = {
  name: string;
  type: OpenApiDataTypes;
  value: string;
};

export type RequestBodyProperty = {
  field: string;
  type: OpenApiDataTypes;
};

export type RequestBody = {
  mediaType: MediaType;
  isArray: boolean;
  properties: RequestBodyProperty[];
};

export type UrlParam = {
  reactPropId: string;
  name: string;
  type: OpenApiDataTypes;
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

export type Parameters = {
  queries?: Queries;
  paths?: Paths;
};

export type RequestConfig = {
  rateLimit: number;
  batchStrategy: string;
  batchLimit: number;
  maxConnections: number;
  requestTimeout: number;
};

export type Response = {
  statusCode: number;
  mediaType: MediaType;
  type: OpenApiDataTypes;
};

export type ModelAPI = {
  url: string;
  method: RequestMethod;
  authType: AuthType;
  authTypeConfig: { [key: string]: string };
  requestBody?: RequestBody;
  requestConfig: RequestConfig;
  response: Response;
  parameters?: Parameters;
};

export type ConfigDescription = {
  name: string;
  description: string;
  modelType: ModelType;
};

export type ModelAPIGraphQLModel = ConfigDescription & ModelAPI;
