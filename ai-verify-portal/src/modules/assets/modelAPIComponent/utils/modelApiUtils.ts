import {
  AuthType,
  ModelApiFormModel,
  ModelApiGQLModel,
  RequestMethod,
} from '../types';

export function transformFormValuesToGraphModel(
  formValues: ModelApiFormModel
): ModelApiGQLModel {
  // delete the duplicated authType from authTypeConfig (it was only used for auth field dependecies validation)
  if (formValues.modelAPI.authTypeConfig) {
    delete formValues.modelAPI.authTypeConfig.authType;
  }

  const { modelAPI, ...otherProps } = formValues;
  const { requestConfig, response, ...otherModelApiProps } = modelAPI;
  const { statusCode, ...otherResponseProps } = response;
  const formToModelApiGqlPayload: ModelApiGQLModel = {
    modelAPI: {
      requestConfig: {
        sslVerify: requestConfig.sslVerify,
        requestTimeout: parseInt(requestConfig.requestTimeout),
        rateLimit: parseFloat(requestConfig.rateLimit),
        rateLimitTimeout: parseInt(requestConfig.rateLimitTimeout),
        connectionRetries: parseInt(requestConfig.connectionRetries),
        batchStrategy: requestConfig.batchStrategy,
        batchLimit: parseInt(requestConfig.batchLimit),
        maxConnections: parseInt(requestConfig.maxConnections),
      },
      response: {
        statusCode: parseInt(statusCode),
        ...otherResponseProps,
      },
      ...otherModelApiProps,
    },
    ...otherProps,
  };

  if (formValues.modelAPI.method === RequestMethod.GET) {
    delete formToModelApiGqlPayload.modelAPI.requestBody;
    // tidy pathParams - remove reactPropId
    const parameters = formToModelApiGqlPayload.modelAPI.parameters;
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
    delete formToModelApiGqlPayload.modelAPI.parameters;
    // tidy requestbody properties - remove reactPropId
    const requestBody = formToModelApiGqlPayload.modelAPI.requestBody;
    if (requestBody && requestBody.properties) {
      requestBody.properties = requestBody.properties.map((prop) => ({
        field: prop.field,
        type: prop.type,
      }));
    }
  }

  //tidy additionalHeaders - remove reactPropId
  if (formToModelApiGqlPayload.modelAPI.additionalHeaders) {
    formToModelApiGqlPayload.modelAPI.additionalHeaders =
      formToModelApiGqlPayload.modelAPI.additionalHeaders.map((header) => ({
        name: header.name,
        type: header.type,
        value: header.value,
      }));
  }

  //tidy authTypeConfig
  if (formToModelApiGqlPayload.modelAPI.authType === AuthType.NO_AUTH) {
    delete formToModelApiGqlPayload.modelAPI.authTypeConfig;
  } else if (formToModelApiGqlPayload.modelAPI.authTypeConfig) {
    if (
      formToModelApiGqlPayload.modelAPI.authType === AuthType.BEARER_TOKEN &&
      'username' in formToModelApiGqlPayload.modelAPI.authTypeConfig
    ) {
      delete formToModelApiGqlPayload.modelAPI.authTypeConfig.username;
      delete formToModelApiGqlPayload.modelAPI.authTypeConfig.password;
    } else if (
      formToModelApiGqlPayload.modelAPI.authType === AuthType.BASIC &&
      'token' in formToModelApiGqlPayload.modelAPI.authTypeConfig
    ) {
      delete formToModelApiGqlPayload.modelAPI.authTypeConfig.token;
    }
  }

  return formToModelApiGqlPayload;
}
