// 👈 TODO - tab url params if paths populated... urlParams will exist even for POST request
import {
  AuthType,
  MediaType,
  ModelApiFormModel,
  ModelApiGQLModel,
  ModelApiGQLQueryResponseModel,
  OpenApiDataTypes,
  RequestMethod,
  ResponseSchemaForm,
  ResponseSchemaGQL,
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
  const { statusCode, field, fieldValueType, ...otherResponseProps } = response;

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

  // form response schema has a handful of permutations. Let's start from clean slate
  formToModelApiGqlPayload.modelAPI.response.schema = {} as ResponseSchemaGQL;

  switch (otherResponseProps.mediaType) {
    case MediaType.APP_JSON:
      if (
        otherResponseProps.schema.type === OpenApiDataTypes.ARRAY &&
        otherResponseProps.schema.items !== undefined
      ) {
        /*
         * schema root type is ARRAY.
         * array items definition is required.
         */
        formToModelApiGqlPayload.modelAPI.response.schema = {
          type: OpenApiDataTypes.ARRAY,
          items: {
            type: otherResponseProps.schema.items.type,
          },
        };

        /*
         * level 1 array items data type is OBJECT.
         * array item 'properties' is required, nested undner schema.items
         */
        if (otherResponseProps.schema.items.type === OpenApiDataTypes.OBJECT) {
          const schema = formToModelApiGqlPayload.modelAPI.response.schema;
          if (
            schema.items !== undefined &&
            otherResponseProps.schema.items.properties !== undefined &&
            field !== undefined
          ) {
            schema.items.properties = {
              [field]: {
                type: otherResponseProps.schema.items.properties._AIVDATA_.type,
              },
            };
          }
        }
      } else if (
        otherResponseProps.schema.type === OpenApiDataTypes.OBJECT &&
        fieldValueType !== undefined &&
        field !== undefined
      ) {
        /*
         * schema root type is OBJECT.
         * set the object's nested dynamic property name and it's data type under 'properties'
         */
        formToModelApiGqlPayload.modelAPI.response.schema = {
          type: OpenApiDataTypes.OBJECT,
          properties: {
            [field]: {
              type: fieldValueType,
            },
          },
        };

        /*
         * level 1 dynamic property data type is ARRAY.
         * set level 2 array items data type under 'items'
         */
        if (
          fieldValueType === OpenApiDataTypes.ARRAY &&
          otherResponseProps.schema.properties &&
          otherResponseProps.schema.properties._AIVDATA_.items
        ) {
          const schema = formToModelApiGqlPayload.modelAPI.response.schema;
          if (schema.properties !== undefined && schema.properties[field]) {
            schema.properties[field] = {
              type: fieldValueType,
              items: {
                type: otherResponseProps.schema.properties._AIVDATA_.items.type,
              },
            };
          }
        }
      }
      break;
    case MediaType.TEXT_PLAIN:
      formToModelApiGqlPayload.modelAPI.response.schema = {
        type: otherResponseProps.schema.type,
      };
      break;
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
        if (requestBody.mediaType === MediaType.FORM_URLENCODED) {
          formToModelApiGqlPayload.modelAPI.requestBody.name = requestBody.name;
          if (!formToModelApiGqlPayload.modelAPI.requestBody.name) {
            console.error(
              'POST:app-json:isArray - requestbody.name is required'
            );
          }
        } else {
          delete requestBody.name;
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

export function replaceDynamicFieldnameWith_AIVDATA(
  schema: ResponseSchemaGQL
): ResponseSchemaForm | [ResponseSchemaForm, string, OpenApiDataTypes] {
  let outputSchema: ResponseSchemaForm;
  if (schema.properties !== undefined) {
    const objectPropertyNames = Object.keys(schema.properties);
    if (objectPropertyNames.length !== 1) {
      throw new Error(
        'There should only be 1 enumerable string properties in schema.properties'
      );
    }

    if (
      schema.properties[objectPropertyNames[0]].type ===
        OpenApiDataTypes.ARRAY &&
      schema.properties[objectPropertyNames[0]].items !== undefined
    ) {
      const itemDataType = schema.properties[objectPropertyNames[0]].items
        ?.type as OpenApiDataTypes;
      outputSchema = {
        type: schema.type,
        properties: {
          _AIVDATA_: {
            type: schema.properties[objectPropertyNames[0]].type,
            items: {
              type: itemDataType,
            },
          },
        },
      };

      return [outputSchema, objectPropertyNames[0], itemDataType];
    }

    if (
      schema.properties[objectPropertyNames[0]].type !== OpenApiDataTypes.ARRAY
    ) {
      const itemDataType = schema.properties[objectPropertyNames[0]].type;
      outputSchema = {
        type: schema.type,
        properties: {
          _AIVDATA_: {
            type: itemDataType,
          },
        },
      };

      return [outputSchema, objectPropertyNames[0], itemDataType];
    }
  }

  if (schema.items !== undefined) {
    if (
      schema.items.type === OpenApiDataTypes.OBJECT &&
      schema.items.properties !== undefined
    ) {
      const objectPropertyNames = Object.keys(schema.items.properties);
      if (objectPropertyNames.length !== 1) {
        throw new Error(
          'There should only be 1 enumerable string properties in schema.items.properties'
        );
      }
      outputSchema = {
        type: schema.type,
        items: {
          type: schema.items.type,
          properties: {
            _AIVDATA_: {
              type: schema.items.properties[objectPropertyNames[0]]
                .type as OpenApiDataTypes,
            },
          },
        },
      };

      return [outputSchema, objectPropertyNames[0], schema.items.type];
    }

    if (schema.items.type !== OpenApiDataTypes.OBJECT) {
      outputSchema = {
        type: schema.type,
        items: {
          type: schema.items.type,
        },
      };

      return outputSchema;
    }
  }

  return {
    type: schema.type,
  };
}
