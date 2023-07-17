import { ModelType } from 'src/types/model.interface';
import { AuthType, MediaType, RequestMethod, URLParamType } from './types';

export const optionsModelTypes = [
  { value: ModelType.Classification, label: ModelType.Classification },
  { value: ModelType.Regression, label: ModelType.Regression },
];

export const optionsUrlParamTypes = [
  { value: URLParamType.QUERY, label: URLParamType.QUERY },
  { value: URLParamType.PATH, label: URLParamType.PATH },
];

export const optionsRequestMethods = [
  { value: RequestMethod.GET, label: RequestMethod.GET },
  { value: RequestMethod.POST, label: RequestMethod.POST },
];

export const optionsAuthMethods = [
  { value: AuthType.NO_AUTH, label: AuthType.NO_AUTH },
  { value: AuthType.BEARER_TOKEN, label: AuthType.BEARER_TOKEN },
  { value: AuthType.BASIC, label: AuthType.BASIC },
];

export const optionsMediaTypes = [
  { value: MediaType.NONE, label: MediaType.NONE },
  { value: MediaType.FORM_URLENCODED, label: MediaType.FORM_URLENCODED },
  { value: MediaType.MULTIPART_FORMDATA, label: MediaType.MULTIPART_FORMDATA },
  { value: MediaType.APP_JSON, label: MediaType.APP_JSON },
  { value: MediaType.TEXT_PLAIN, label: MediaType.TEXT_PLAIN },
];

export const optionsOpenApiDataTypes = [
  { value: MediaType.NONE, label: MediaType.NONE },
  { value: MediaType.FORM_URLENCODED, label: MediaType.FORM_URLENCODED },
  { value: MediaType.MULTIPART_FORMDATA, label: MediaType.MULTIPART_FORMDATA },
  { value: MediaType.APP_JSON, label: MediaType.APP_JSON },
  { value: MediaType.TEXT_PLAIN, label: MediaType.TEXT_PLAIN },
];
