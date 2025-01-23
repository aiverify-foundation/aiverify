export interface AdditionalHeader {
  name: string;
  type: string;
  value: unknown;
}

export interface PathParam {
  name: string;
  type: string;
}

export interface QueryParam {
  name: string;
  type: string;
}

export interface Paths {
  mediaType: string;
  isArray: boolean;
  maxItems: number;
  pathParams: PathParam[];
}

export interface Queries {
  mediaType: string;
  name: string;
  isArray: boolean;
  maxItems: number;
  queryParams: QueryParam[];
}

export interface Parameters {
  paths: Paths;
  queries: Queries;
}

export interface RequestBodyProperty {
  field: string;
  type: string;
}

export interface RequestBody {
  mediaType: string;
  isArray: boolean;
  name: string;
  maxItems: number;
  properties: RequestBodyProperty[];
}

export interface Response {
  statusCode: number;
  mediaType: string;
  schema: unknown;
}

export interface RequestConfig {
  sslVerify: boolean;
  connectionTimeout: number;
  rateLimit: number;
  rateLimitTimeout: number;
  batchLimit: number;
  connectionRetries: number;
  maxConnections: number;
  batchStrategy: string;
}

export interface ModelAPI {
  method: string;
  url: string;
  urlParams: string;
  authType: string;
  authTypeConfig: unknown;
  additionalHeaders: AdditionalHeader[];
  parameters: Parameters;
  requestBody: RequestBody;
  response: Response;
  requestConfig: RequestConfig;
}

export interface ParameterMappings {
  requestBody: unknown;
  parameters: unknown;
}

export interface TestModel {
  id: number;
  name: string;
  description: string;
  mode: string;
  modelType: string;
  fileType: string;
  filename: string;
  zip_hash: string;
  size: number;
  serializer: string;
  modelFormat: string;
  modelAPI: ModelAPI;
  parameterMappings: ParameterMappings;
  status: string;
  errorMessages: string;
  created_at: string;
  updated_at: string;
}

export interface Column<T> {
  field: keyof T; // Matches a key from T e.g. 'name', 'status', 'id'
  headerName: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (row: T) => React.ReactNode;
}
