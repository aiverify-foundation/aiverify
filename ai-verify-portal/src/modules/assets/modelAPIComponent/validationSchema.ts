import { object, string, number, bool, array, addMethod, boolean } from 'yup';
import {
  AuthType,
  MediaType,
  OpenApiDataTypes,
  RequestMethod,
  URLParamType,
} from './types';

declare module 'yup' {
  //@ts-ignore
  interface ObjectSchema<T> {
    //@ts-ignore
    uniqueProperty(propertyName: string, message?: string): ObjectSchema<T>;
  }
}

const urlPattern = new RegExp(
  '^([a-zA-Z]+:\\/\\/)?' + // protocol
    'localhost|' + // localhost
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // OR domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
  'i'
);

// Weirdly, add method context binding needs to use 'this' binding. Arrow function doesn't work
addMethod(object, 'uniqueProperty', function (propertyName, message) {
  return this.test('unique', message, function (value: { [x: string]: any }) {
    if (!value || !value[propertyName]) {
      return true;
    }
    //@ts-ignore
    const { path } = this;
    //@ts-ignore
    const options = [...this.parent];
    const currentIndex = options.indexOf(value);

    const subOptions = options.slice(0, currentIndex);

    if (
      subOptions.some((option) => option[propertyName] === value[propertyName])
    ) {
      //@ts-ignore
      throw this.createError({
        path: `${path}.${propertyName}`,
        message,
      });
    }

    return true;
  });
});

const unlimited = -1;

export const ModelAPIFormValidationSchema = object({
  name: string()
    .min(5, 'Min 5 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  description: string()
    .min(20, 'Min 20 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  modelAPI: object({
    method: string().required('Required'),
    url: string().matches(urlPattern, 'Invalid URL').required('Required'),
    requestConfig: object({
      rateLimit: number()
        .min(unlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      rateLimitTimeout: number()
        .min(unlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      batchStrategy: string().required('Required'),
      batchLimit: number()
        .min(unlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      connectionRetries: number()
        .min(0, 'Must be 0 or greater')
        .max(5, 'Must be less than 6')
        .typeError('Must be a number'),
      maxConnections: number()
        .min(unlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      connectionTimeout: number()
        .min(unlimited, 'Invalid. Enter -1 for no timeout')
        .required('Required')
        .typeError('Must be a number'),
      sslVerify: boolean().required('Required'),
    }),
    response: object({
      statusCode: number()
        .typeError('Must be a number')
        .min(100, 'Invalid Status Code')
        .max(599, 'Invalid Status Code')
        .required('Required'),
      mediaType: string().required('Required'),
      schema: object({
        type: string().required('Required'),
        items: object().when('type', {
          is: OpenApiDataTypes.ARRAY,
          then: () =>
            object({
              type: string().required('Required'),
            }),
          otherwise: () => object({}),
        }),
      }),
      field: string().when(['mediaType', 'schema.type', 'schema.items.type'], {
        is: (
          mediaType: string,
          schemaRootType: string,
          schemaArrayItemsType: string
        ) => {
          return (
            (mediaType === MediaType.APP_JSON &&
              schemaRootType === OpenApiDataTypes.OBJECT) ||
            (mediaType === MediaType.APP_JSON &&
              schemaRootType === OpenApiDataTypes.ARRAY &&
              schemaArrayItemsType === OpenApiDataTypes.OBJECT)
          );
        },
        then: (schema) => schema.required('Required'),
      }),
    }),
    authType: string().required(),
    authTypeConfig: object({
      authType: string(), // duplicated here for the `when()` dependencies below. Yup `when()` has limitation - it cannot refer to fields up the tree.
      token: string()
        .min(1, 'Min 32 characters')
        .max(1024, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BEARER_TOKEN,
          then: (schema) => schema.required('Required'),
        }),
      username: string()
        .max(128, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BASIC,
          then: (schema) => schema.required('Required'),
        }),
      password: string()
        .max(128, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BASIC,
          then: (schema) => schema.required('Required'),
        }),
    }),
    requestBody: object().when('method', {
      is: RequestMethod.POST,
      then: () =>
        object({
          mediaType: string().required('Required'),
          isArray: bool(), // isArray under requestBody is not read by backend test-engine openapi translator. Leaving it here in case backend wants to support in future
          properties: array()
            .of(
              object({
                field: string().required('Required'),
                type: string().required('Required'),
              }).uniqueProperty('field', 'Property Exists')
            )
            .min(1, 'Properties required'),
        }),
      otherwise: () => object({}),
    }),
    parameters: object().when('method', {
      is: RequestMethod.GET,
      then: () =>
        object({
          paramType: string(),
          queries: object().when('paramType', {
            is: (paramType: string) => paramType === URLParamType.QUERY,
            then: () =>
              object({
                mediaType: string().required('Required'),
                isArray: bool(),
                queryParams: array()
                  .of(
                    object({
                      name: string().required('Required'),
                      type: string().required('Required'),
                    }).uniqueProperty('name', 'Property Exists')
                  )
                  .min(1, 'Path Parameters required'),
              }),
            otherwise: () => object({}),
          }),
        }),
      otherwise: () => object({}),
    }),
    paths: object().when('method', {
      is: RequestMethod.GET,
      then: () =>
        object().when('paramType', {
          is: (paramType: string) => paramType === URLParamType.PATH,
          then: () =>
            object({
              mediaType: string().required('Required'),
              isArray: bool(),
              pathParams: array()
                .of(
                  object({
                    name: string().required('Required'),
                    type: string().required('Required'),
                  }).uniqueProperty('name', 'Property Exists')
                )
                .min(1, 'URL Parameters required'),
            }),
          otherwise: () => object({}),
        }),
      otherwise: () => object({}),
    }),
    additionalHeaders: array().of(
      object({
        name: string().required('Required'),
        type: string().required('Required'),
        value: string().required('Required'),
      }).uniqueProperty('name', 'Header Exists')
    ),
  }),
});
