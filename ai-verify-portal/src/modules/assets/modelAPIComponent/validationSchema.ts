import * as Yup from 'yup';

const urlPattern = new RegExp(
  '^([a-zA-Z]+:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
  'i'
);

export const ModelAPIFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, 'Too short. Min 5 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  description: Yup.string()
    .min(20, 'Too short. Min 20 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  modelAPI: Yup.object().shape({
    url: Yup.string()
      .matches(urlPattern, 'Invalid URL')
      .required('URL is required'),
    requestConfig: Yup.object().shape({
      rateLimit: Yup.number().min(-1, 'Invalid number').required('Required'),
      batchLimit: Yup.number().min(-1, 'Invalid number').required('Required'),
      maxConnections: Yup.number()
        .min(-1, 'Invalid number')
        .required('Required'),
      requestTimeout: Yup.number()
        .min(1, 'Invalid number')
        .required('Required'),
    }),
    authTypeConfig: Yup.object().shape({
      token: Yup.string()
        .min(32, 'Too short. Min 32 characters')
        .max(128, 'Max 128 characters'),
      username: Yup.string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters'),
      password: Yup.string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters'),
    }),
  }),
});
