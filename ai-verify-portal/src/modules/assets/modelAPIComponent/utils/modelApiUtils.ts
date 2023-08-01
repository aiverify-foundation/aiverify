import {
  AuthType,
  ModelAPIFormModel,
  ModelAPIGraphQLModel,
  RequestMethod,
} from '../types';

export function transformFormValuesToGraphModel(
  formValues: ModelAPIFormModel
): ModelAPIGraphQLModel {
  // delete the duplicated authType from authTypeConfig (it was only used for auth field dependecies validation)
  if (formValues.modelAPI.authTypeConfig) {
    delete formValues.modelAPI.authTypeConfig.authType;
  }
  const gqlModelAPIInput: ModelAPIGraphQLModel = { ...formValues };

  if (formValues.modelAPI.method === RequestMethod.GET) {
    delete gqlModelAPIInput.modelAPI.requestBody;
    // tidy pathParams - remove reactPropId
    const parameters = gqlModelAPIInput.modelAPI.parameters;
    if (parameters && parameters.paths) {
      parameters.paths.pathParams = parameters.paths.pathParams.map(
        (param) => ({
          name: param.name,
          type: param.type,
        })
      );
    } else if (parameters && parameters.queries) {
      parameters.queries.queryParams = parameters.queries.queryParams.map(
        (param) => ({
          name: param.name,
          type: param.type,
        })
      );
    }
  } else {
    delete gqlModelAPIInput.modelAPI.parameters;
    // tidy requestbody properties - remove reactPropId
    const requestBody = gqlModelAPIInput.modelAPI.requestBody;
    if (requestBody && requestBody.properties) {
      requestBody.properties = requestBody.properties.map((prop) => ({
        field: prop.field,
        type: prop.type,
      }));
    }
  }

  //tidy additionalHeaders - remove reactPropId
  if (gqlModelAPIInput.modelAPI.additionalHeaders) {
    gqlModelAPIInput.modelAPI.additionalHeaders =
      gqlModelAPIInput.modelAPI.additionalHeaders.map((header) => ({
        name: header.name,
        type: header.type,
        value: header.value,
      }));
  }

  //tidy authTypeConfig
  if (gqlModelAPIInput.modelAPI.authType === AuthType.NO_AUTH) {
    delete gqlModelAPIInput.modelAPI.authTypeConfig;
  } else if (gqlModelAPIInput.modelAPI.authTypeConfig) {
    if (
      gqlModelAPIInput.modelAPI.authType === AuthType.BEARER_TOKEN &&
      'username' in gqlModelAPIInput.modelAPI.authTypeConfig
    ) {
      delete gqlModelAPIInput.modelAPI.authTypeConfig.username;
      delete gqlModelAPIInput.modelAPI.authTypeConfig.password;
    } else if (
      gqlModelAPIInput.modelAPI.authType === AuthType.BASIC &&
      'token' in gqlModelAPIInput.modelAPI.authTypeConfig
    ) {
      delete gqlModelAPIInput.modelAPI.authTypeConfig.token;
    }
  }

  return gqlModelAPIInput;
}
