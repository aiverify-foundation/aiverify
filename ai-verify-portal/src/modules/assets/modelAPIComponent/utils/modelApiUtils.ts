// 👈 TODO - tab url params if paths populated... urlParams will exist even for POST request
import {
  AuthType,
  MediaType,
  ModelApiFormModel,
  ModelApiGQLModel,
  RequestMethod,
} from '../types';

export function transformFormValuesToGraphModel(
  formValues: ModelApiFormModel
): ModelApiGQLModel {
  const { modelAPI, ...otherProps } = formValues;
  const { requestConfig, response, authTypeConfig, ...otherModelApiProps } =
    modelAPI;
  const { authType, ...otherAuthTypeConfigProps } = authTypeConfig;
  const { statusCode, field, ...otherResponseProps } = response;
  const formToModelApiGqlPayload: ModelApiGQLModel = {
    modelAPI: {
      requestConfig: {
        sslVerify: requestConfig.sslVerify,
        connectionTimeout: parseInt(requestConfig.connectionTimeout),
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

  // add response.field if media type is app/json
  if (otherResponseProps.mediaType === MediaType.APP_JSON) {
    formToModelApiGqlPayload.modelAPI.response.field = field;
  }

  //populate authType config if not NO_AUTH
  if (authType !== AuthType.NO_AUTH) {
    //tidy authTypeConfig
    if (authType === AuthType.BEARER_TOKEN) {
      delete otherAuthTypeConfigProps.username;
      delete otherAuthTypeConfigProps.password;
    } else if (authType === AuthType.BASIC) {
      delete otherAuthTypeConfigProps.token;
    }
    formToModelApiGqlPayload.modelAPI.authTypeConfig = {
      ...otherAuthTypeConfigProps,
    };
  }

  if (formValues.modelAPI.method === RequestMethod.GET) {
    if (formToModelApiGqlPayload.modelAPI.parameters) {
      delete formToModelApiGqlPayload.modelAPI.requestBody;
      if ('paramType' in formToModelApiGqlPayload.modelAPI.parameters) {
        delete formToModelApiGqlPayload.modelAPI.parameters.paramType;
      }
      // tidy params - remove reactPropId
      if (formToModelApiGqlPayload.modelAPI.parameters.paths) {
        // TODO - fix name field
        if (!formToModelApiGqlPayload.modelAPI.parameters.paths.isArray) {
          delete formToModelApiGqlPayload.modelAPI.parameters.paths.name;
        }
        formToModelApiGqlPayload.modelAPI.parameters.paths.pathParams =
          formToModelApiGqlPayload.modelAPI.parameters.paths.pathParams.map(
            (param) => ({
              name: param.name,
              type: param.type,
            })
          );
      } else if (formToModelApiGqlPayload.modelAPI.parameters.queries) {
        formToModelApiGqlPayload.modelAPI.parameters.queries.queryParams =
          formToModelApiGqlPayload.modelAPI.parameters.queries.queryParams.map(
            (param) => ({
              name: param.name,
              type: param.type,
            })
          );
      }
    }
  } else {
    delete formToModelApiGqlPayload.modelAPI.parameters;
    if (
      formValues.modelAPI.requestBody &&
      formValues.modelAPI.requestBody.properties
    ) {
      formToModelApiGqlPayload.modelAPI.requestBody = {
        mediaType: formValues.modelAPI.requestBody.mediaType,
        isArray: formValues.modelAPI.requestBody.isArray,
        properties: formValues.modelAPI.requestBody.properties.map((prop) => ({
          field: prop.field,
          type: prop.type,
        })),
      };
    }
  }

  //tidy additionalHeaders - remove reactPropId
  if (
    otherModelApiProps.additionalHeaders &&
    otherModelApiProps.additionalHeaders.length
  ) {
    formToModelApiGqlPayload.modelAPI.additionalHeaders =
      otherModelApiProps.additionalHeaders.map((header) => ({
        name: header.name,
        type: header.type,
        value: header.value,
      }));
  } else {
    delete formToModelApiGqlPayload.modelAPI.additionalHeaders;
  }

  return formToModelApiGqlPayload;
}
