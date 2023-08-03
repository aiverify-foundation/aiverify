import { object, string, number, bool, array, addMethod, boolean } from 'yup';
import { AuthType, MediaType } from './types';
import { ConnectionSettingUnlimited } from './constants';

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

addMethod(object, 'uniqueProperty', function (propertyName, message) {
  return this.test('unique', message, function (value: { [x: string]: any }) {
    if (!value || !value[propertyName]) {
      return true;
    }

    const { path } = this;
    const options = [...this.parent];
    const currentIndex = options.indexOf(value);

    const subOptions = options.slice(0, currentIndex);

    if (
      subOptions.some((option) => option[propertyName] === value[propertyName])
    ) {
      throw this.createError({
        path: `${path}.${propertyName}`,
        message,
      });
    }

    return true;
  });
});

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
    url: string()
      .matches(urlPattern, 'Invalid URL')
      .required('URL is required'),
    requestConfig: object({
      rateLimit: number()
        .min(ConnectionSettingUnlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      rateLimitTimeout: number()
        .min(ConnectionSettingUnlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      batchStrategy: string().required('Required'),
      batchLimit: number()
        .min(ConnectionSettingUnlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      connectionRetries: number()
        .min(0, 'Must be 0 or greater')
        .max(5, 'Must be less than 6')
        .typeError('Must be a number'),
      maxConnections: number()
        .min(ConnectionSettingUnlimited, 'Invalid. Enter -1 for unlimited')
        .required('Required')
        .typeError('Must be a number'),
      requestTimeout: number()
        .min(3, 'Must be greater than 2')
        .max(5, 'Must be less than 6')
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
      type: string().required('Required'),
      field: string().when('mediaType', {
        is: MediaType.APP_JSON,
        then: (schema) => schema.required('Required'),
      }),
    }),
    authType: string().required(),
    authTypeConfig: object({
      authType: string(), // duplicated here for the `when()` dependencies below. Yup `when()` has limitation - it cannot refer to fields up the tree.
      token: string()
        .min(32, 'Min 32 characters')
        .max(128, 'Max 128 characters')
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
    requestBody: object({
      mediaType: string().required('REquired'),
      isArray: bool(),
      properties: array().of(
        object({
          field: string().required('Required'),
          type: string().required('Required'),
        }).uniqueProperty('field', 'Property Exists')
      ),
    }),
  }),
});
