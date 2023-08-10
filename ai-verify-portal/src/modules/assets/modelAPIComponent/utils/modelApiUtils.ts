// 👈 TODO - tab url params if paths populated... urlParams will exist even for POST request
import {
  AuthType,
  MediaType,
  ModelApiFormModel,
  ModelApiGQLModel,
  RequestMethod,
  URLParamType,
} from '../types';

export function transformFormValuesToGraphModel(
  formValues: ModelApiFormModel
): ModelApiGQLModel {
  const { modelAPI, ...otherProps } = formValues;
  const {
    requestConfig,
    requestBody,
    parameters,
    response,
    authTypeConfig,
    ...otherModelApiProps
  } = modelAPI;
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
      requestBody: {} as never, // populate below based on `method`
      parameters: {} as never, // populate below based on `method`
      ...otherModelApiProps,
    },
    ...otherProps,
  };

  // add response.field if media type is `application/json`
  if (otherResponseProps.mediaType === MediaType.APP_JSON) {
    formToModelApiGqlPayload.modelAPI.response.field = field;
  }

  //populate authType config if not `NO_AUTH`
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
    if (parameters) {
      delete formToModelApiGqlPayload.modelAPI.requestBody;
      // tidy params - remove reactPropId
      if (parameters.paramType === URLParamType.PATH && parameters.paths) {
        formToModelApiGqlPayload.modelAPI.parameters = {
          paths: {
            mediaType: parameters.paths.mediaType,
            isArray: parameters.paths.isArray,
            pathParams: parameters.paths.pathParams.map((param) => ({
              name: param.name,
              type: param.type,
            })),
          },
        };
        if (
          parameters.paths.isArray === true &&
          parameters.paths.maxItems != undefined
        ) {
          formToModelApiGqlPayload.modelAPI.parameters.paths.maxItems =
            parseInt(parameters.paths.maxItems);
        }
      } else if (
        parameters.paramType === URLParamType.QUERY &&
        parameters.queries
      ) {
        formToModelApiGqlPayload.modelAPI.parameters = {
          queries: {
            mediaType: parameters.queries.mediaType,
            isArray: parameters.queries.isArray,
            queryParams: parameters.queries.queryParams.map((param) => ({
              name: param.name,
              type: param.type,
            })),
          },
        };

        if (parameters.queries.isArray === true) {
          formToModelApiGqlPayload.modelAPI.parameters.queries.name =
            parameters.queries.name;
          if (!formToModelApiGqlPayload.modelAPI.parameters.queries.name) {
            console.error('GET:queries:isArray - queries.name is required');
          }
          if (parameters.queries.maxItems != undefined) {
            formToModelApiGqlPayload.modelAPI.parameters.queries.maxItems =
              parseInt(parameters.queries.maxItems);
          }
        }

        delete formToModelApiGqlPayload.modelAPI.urlParams;
      }
    }
  }

  if (formValues.modelAPI.method === RequestMethod.POST) {
    delete formToModelApiGqlPayload.modelAPI.parameters;
    delete formToModelApiGqlPayload.modelAPI.urlParams;
    if (requestBody) {
      formToModelApiGqlPayload.modelAPI.requestBody = {
        mediaType: requestBody.mediaType,
        isArray: requestBody.isArray,
        properties: requestBody.properties.map((prop) => ({
          field: prop.field,
          type: prop.type,
        })),
      };

      if (requestBody.isArray === true) {
        formToModelApiGqlPayload.modelAPI.requestBody.name = requestBody.name;
        if (!formToModelApiGqlPayload.modelAPI.requestBody.name) {
          console.error('POST:isArray - requestbody.name is required');
        }

        if (requestBody.maxItems != undefined) {
          formToModelApiGqlPayload.modelAPI.requestBody.maxItems = parseInt(
            requestBody.maxItems
          );
        }
      }
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
  console.log(formToModelApiGqlPayload);
  return formToModelApiGqlPayload;
}
