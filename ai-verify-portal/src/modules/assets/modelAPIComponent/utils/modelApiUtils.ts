import {
  ModelAPIFormModel,
  ModelAPIGraphQLModel,
  RequestMethod,
} from '../types';

export function transformFormValuesToGraphModel(
  formValues: ModelAPIFormModel
): ModelAPIGraphQLModel {
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

  return gqlModelAPIInput;
}
