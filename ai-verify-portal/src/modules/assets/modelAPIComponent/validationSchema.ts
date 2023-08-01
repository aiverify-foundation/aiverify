import { object, string, number } from 'yup';
import { AuthType } from './types';

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

export const ModelAPIFormSchema = object({
  name: string()
    .min(5, 'Too short. Min 5 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  description: string()
    .min(20, 'Too short. Min 20 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  modelAPI: object({
    url: string()
      .matches(urlPattern, 'Invalid URL')
      .required('URL is required'),
    requestConfig: object({
      rateLimit: number()
        .min(-1, 'Invalid number')
        .required('Required')
        .typeError('Must be a number'),
      batchLimit: number()
        .min(-1, 'Invalid number')
        .required('Required')
        .typeError('Must be a number'),
      maxConnections: number()
        .min(-1, 'Invalid number')
        .required('Required')
        .typeError('Must be a number'),
      requestTimeout: number()
        .min(1, 'Invalid number')
        .required('Required')
        .typeError('Must be a number'),
    }),
    response: object({
      statusCode: number()
        .typeError('Must be a number')
        .min(100, 'Invalid Status Code')
        .max(599, 'Invalid Status Code')
        .required('Required'),
    }),
    authType: string().required(),
    authTypeConfig: object({
      authType: string(), // duplicated here for the `when()` dependecies below. Yup when() has limitation - it cannot refer to fields up the tree.
      token: string()
        .min(32, 'Too short. Min 32 characters')
        .max(128, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BEARER_TOKEN,
          then: (schema) => schema.required('Required'),
        }),
      username: string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BASIC,
          then: (schema) => schema.required('Required'),
        }),
      password: string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters')
        .when('authType', {
          is: AuthType.BASIC,
          then: (schema) => schema.required('Required'),
        }),
    }),
  }),
});
