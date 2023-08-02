import { GetServerSideProps } from 'next';
import { getModelAPIConfig } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/modelAPIComponent';
import {
  MediaType,
  ModelAPIFormModel,
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
  formValues?: ModelAPIFormModel;
}> = async ({ params }) => {
  if (!params || !params.id) {
    return {
      props: {},
    };
  }

  const id = params.id as string;
  const result = await getModelAPIConfig(id);
  if (!result) {
    return { notFound: true };
  }

  /*
    Shaping `ModelAPIFormModel` object for modelApiConfig component to consume
    1) Add all required (typed as non-optional) properties
    2) For required properties which graphQL query returned values are null, assign default values to them first
    3) Remove __typename properties
    4) Populate properties which were set to default values
    5) Generate and add `reactPropId` to the parameters, properties arrays items. These Ids are only used as React `key` prop values
  */
  const formValues: ModelAPIFormModel = {
    name: result.name,
    description: result.description,
    modelType: result.modelType,
    modelAPI: {
      method: result.modelAPI.method,
      url: result.modelAPI.url,
      authType: result.modelAPI.authType,
      requestConfig: (() => {
        const { __typename, ...rest } = result.modelAPI.requestConfig;
        return rest;
      })(),
      response: (() => {
        const { __typename, ...rest } = result.modelAPI.response;
        return rest;
      })(),
      requestBody: {
        // set to default first, then populate at next step
        mediaType: MediaType.NONE,
        isArray: false,
        properties: [],
      },
      parameters: {
        // set to default first, then populate at next step
        queries: {
          mediaType: MediaType.NONE,
          isArray: false,
          queryParams: [],
        },
      },
    },
  };

  // set to batchLimit -1 which should be default value (to support the older data which did not have default -1) TODO: remove this code when data updated
  if (formValues.modelAPI.requestConfig.batchLimit === null) {
    formValues.modelAPI.requestConfig.batchLimit = -1;
  }

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

  if (
    result.modelAPI.parameters &&
    result.modelAPI.parameters.queries !== null
  ) {
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

  if (result.modelAPI.parameters && result.modelAPI.parameters.paths !== null) {
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
    },
  };
};

export default function ModelAPIConfigPage({
  disabled,
  id,
  formValues,
}: NewModelApiConfigModuleProps) {
  return (
    <NewModelApiConfigModule
      id={id}
      formValues={formValues}
      disabled={disabled}
    />
  );
}
