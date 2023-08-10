import { GetServerSideProps } from 'next';
import { getModelAPIConfig } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/modelAPIComponent';
import {
  AuthType,
  MediaType,
  ModelApiFormModel,
  RequestMethod,
  URLParamType,
} from 'src/modules/assets/modelAPIComponent/types';

/*
  This id is only used for react component `key` props for the list of urlparams and request body property fields rendered.
  Do not use it for any other purposes.
 */
function initReactKeyIdGenerator() {
  let count = 0;
  return () => `input${Date.now()}${count++}`;
}

export const getInputReactKeyId = initReactKeyIdGenerator();

export const getServerSideProps: GetServerSideProps<{
  id?: string;
  formValues?: ModelApiFormModel;
}> = async ({ params, query }) => {
  if (!params || !params.id) {
    return {
      props: {},
    };
  }

  const id = params.id as string;
  const from = query.from as string;
  const result = await getModelAPIConfig(id);
  if (!result) {
    return { notFound: true };
  }

  /*
    Shaping `ModelApiFormModel` object for modelApiConfig component to consume
    1) Add all required (typed as non-optional) properties
    2) Cast numbers to string (the form managed by formik treats all inputs as strings)
    3) For required properties which graphQL query returned values are null, assign default values to them first
    4) Remove __typename properties
    5) Populate properties which were set to default values
    6) Generate and add `reactPropId` to the parameters, properties arrays items. These Ids are only used as React `key` prop values
    7) Delete optional properties which values are `null` - Do not populate Formik form input values with `null`
  */
  const formValues: ModelApiFormModel = {
    name: result.name,
    description: result.description,
    modelType: result.modelType,
    modelAPI: {
      method: result.modelAPI.method,
      url: result.modelAPI.url,
      urlParams: result.modelAPI.urlParams || '',
      authType: result.modelAPI.authType,
      authTypeConfig: result.modelAPI.authTypeConfig,
      requestConfig: (() => {
        const {
          __typename,
          connectionTimeout,
          rateLimit,
          rateLimitTimeout,
          connectionRetries,
          maxConnections,
          batchLimit,
          ...rest
        } = result.modelAPI.requestConfig;
        return {
          connectionTimeout: connectionTimeout.toString(),
          rateLimit: rateLimit.toString(),
          rateLimitTimeout: rateLimitTimeout.toString(),
          connectionRetries: connectionRetries.toString(),
          maxConnections: maxConnections.toString(),
          batchLimit: batchLimit.toString(),
          ...rest,
        };
      })(),
      response: (() => {
        const { __typename, statusCode, ...rest } = result.modelAPI.response;
        return {
          statusCode: statusCode.toString(),
          ...rest,
        };
      })(),
      requestBody: {} as never, // populate at next step
      parameters: {} as never, // populate at next step
    },
  };

  // refer to modules/assets/modelAPIComponent/constants.ts for defaults
  // defaults here should be in sync with defaults in constants.ts

  // if authtypeconfig is null, set defaults
  if (!result.modelAPI.authTypeConfig) {
    formValues.modelAPI.authTypeConfig = {
      authType: AuthType.NO_AUTH, // authType is duplicated here in Form Model to allow easy Yup validation dependency rules. Remove in gql request.
      token: '',
      username: '',
      password: '',
    };
  }

  // populate requestBody, parameters and additonalHeaders if they are not NULL
  if (
    result.modelAPI.method === RequestMethod.POST &&
    result.modelAPI.requestBody
  ) {
    formValues.modelAPI.requestBody = {
      ...(() => {
        const { __typename, ...rest } = result.modelAPI.requestBody;
        return rest;
      })(),
      // add reactPropId
      properties: result.modelAPI.requestBody.properties.map((prop) => ({
        field: prop.field,
        type: prop.type,
        reactPropId: getInputReactKeyId(),
      })),
    };
  } else if (
    result.modelAPI.method === RequestMethod.GET &&
    result.modelAPI.parameters
  ) {
    if (result.modelAPI.parameters.queries) {
      formValues.modelAPI.parameters = {
        paramType: URLParamType.QUERY,
        queries: {
          ...(() => {
            const { __typename, ...rest } = result.modelAPI.parameters.queries;
            return rest;
          })(),
          // add reactPropId
          queryParams: result.modelAPI.parameters.queries.queryParams.map(
            (param) => ({
              name: param.name,
              type: param.type,
              reactPropId: getInputReactKeyId(),
            })
          ),
        },
        paths: {
          //set queries to default
          mediaType: MediaType.NONE,
          isArray: false,
          pathParams: [],
        },
      };
    } else if (result.modelAPI.parameters.paths) {
      formValues.modelAPI.parameters = {
        paramType: URLParamType.PATH,
        paths: {
          ...(() => {
            const { __typename, ...rest } = result.modelAPI.parameters.paths;
            return rest;
          })(),
          // add reactPropId
          pathParams: result.modelAPI.parameters.paths.pathParams.map(
            (param) => ({
              name: param.name,
              type: param.type,
              reactPropId: getInputReactKeyId(),
            })
          ),
        },
        queries: {
          //set queries to default
          mediaType: MediaType.NONE,
          isArray: false,
          queryParams: [],
        },
      };
    }

    // set requestBody to default
    formValues.modelAPI.requestBody = {
      mediaType: MediaType.FORM_URLENCODED,
      isArray: false,
      properties: [],
    };
  }

  if (
    result.modelAPI.additionalHeaders &&
    result.modelAPI.additionalHeaders !== null
  ) {
    // add reactPropId
    formValues.modelAPI.additionalHeaders =
      result.modelAPI.additionalHeaders.map((header) => ({
        name: header.name,
        type: header.type,
        value: header.value,
        reactPropId: getInputReactKeyId(),
      }));
  }

  // delete field if null
  if (formValues.modelAPI.response.field == null) {
    delete formValues.modelAPI.response.field;
  }

  const moduleProps: NewModelApiConfigModuleProps = {
    disabled: true,
    id: result.id,
    formValues,
  };

  if (from) {
    moduleProps.entryPoint = from;
  }

  return {
    props: moduleProps,
  };
};

export default function ModelAPIConfigPage({
  disabled,
  id,
  formValues,
  entryPoint,
}: NewModelApiConfigModuleProps) {
  return (
    <NewModelApiConfigModule
      id={id}
      formValues={formValues}
      disabled={entryPoint === 'selectModel' ? false : disabled}
      entryPoint={entryPoint}
    />
  );
}
