import { GetServerSideProps } from 'next';
import { getModelAPIConfig } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/modelAPIComponent';
import {
  MediaType,
  ModelApiFormModel,
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
  */
  const formValues: ModelApiFormModel = {
    name: result.name,
    description: result.description,
    modelType: result.modelType,
    modelAPI: {
      method: result.modelAPI.method,
      url: result.modelAPI.url,
      authType: result.modelAPI.authType,
      requestConfig: (() => {
        const {
          __typename,
          requestTimeout,
          rateLimit,
          rateLimitTimeout,
          connectionRetries,
          maxConnections,
          batchLimit,
          ...rest
        } = result.modelAPI.requestConfig;
        return {
          requestTimeout: requestTimeout.toString(),
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
      requestBody: {
        // set to default first, then populate at next step
        mediaType: MediaType.NONE,
        isArray: false,
        properties: [],
      },
      parameters: {
        paramType: URLParamType.QUERY,
        // set to default first, then populate at next step
        queries: {
          mediaType: MediaType.NONE,
          isArray: false,
          queryParams: [],
        },
        paths: {
          mediaType: MediaType.NONE,
          isArray: false,
          pathParams: [],
        },
      },
    },
  };

  // add urlParams, authTypeConfig properties if they are not null properties. Otherwise, just omit them from the object.
  if (result.modelAPI.urlParams !== null) {
    formValues.modelAPI.urlParams = result.modelAPI.urlParams;
  }

  if (result.modelAPI.authTypeConfig !== null) {
    formValues.modelAPI.authTypeConfig = result.modelAPI.authTypeConfig;
  }

  // populate requestBody, parameters and additonalHeaders if they are not NULL
  if (result.modelAPI.requestBody !== null) {
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
  }

  if (result.modelAPI.parameters && result.modelAPI.parameters.queries) {
    formValues.modelAPI.parameters = {
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
    };
  }

  if (result.modelAPI.parameters && result.modelAPI.parameters.paths) {
    formValues.modelAPI.parameters = {
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

  return {
    props: {
      disabled: true,
      id: result.id,
      formValues,
      entryPoint: from,
    },
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
