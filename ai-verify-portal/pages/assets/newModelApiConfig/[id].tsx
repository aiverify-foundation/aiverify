import { result } from 'lodash';
import { GetServerSideProps } from 'next';
import { getModelAPIConfig } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/newModelApiConfig';
import {
  MediaType,
  ModelAPIFormModel,
  ModelAPIGraphQLQueryResponseModel,
} from 'src/modules/assets/types';

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
    Shaping to `ModelAPIFormModel`
    1) Delete optional properties which graphQL query returned values are null
    2) For non-optional properties which graphQL query returned values are null, assign them to the default values
    3) Remove __typename properties
    4) Generate and add `reactPropId` to the parameters, properties arrays
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
        mediaType: MediaType.NONE,
        isArray: false,
        properties: [],
      },
      parameters: {
        queries: {
          mediaType: MediaType.NONE,
          isArray: false,
          queryParams: [],
        },
      },
    },
  };

  // set to -1 (to support the older configs which did not have default -1)
  if (formValues.modelAPI.requestConfig.batchLimit === null) {
    formValues.modelAPI.requestConfig.batchLimit = -1;
  }

  // delete any null properties
  if (result.modelAPI.urlParams !== null) {
    formValues.modelAPI.urlParams = result.modelAPI.urlParams;
  }

  if (result.modelAPI.authTypeConfig !== null) {
    formValues.modelAPI.authTypeConfig = result.modelAPI.authTypeConfig;
  }

  if (result.modelAPI.requestBody !== null) {
    formValues.modelAPI.requestBody = {
      ...result.modelAPI.requestBody,
      // add reactPropId = ''
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
        // add reactPropId = ''
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
        // add reactPropId = ''
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

  return {
    props: {
      id: result.id,
      formValues,
    },
  };
};

export default function ModelAPIConmfigPage({
  id,
  formValues,
}: NewModelApiConfigModuleProps) {
  return <NewModelApiConfigModule id={id} formValues={formValues} />;
}
