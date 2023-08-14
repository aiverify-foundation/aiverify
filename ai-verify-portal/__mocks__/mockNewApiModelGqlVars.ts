export const saveConfigVariables_tc000 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc001',
    method: 'POST',
    authType: 'No Auth',
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc001 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc001',
    method: 'POST',
    authType: 'Bearer Token',
    authTypeConfig: {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMmY4MTJiNmJlM2IzMjEyMTQzMjBjZiIsImlhdCI6MTY2MDE5Nzg3MCwiZXhwIjoxNjYyNzg5ODcwfQ.cebsoHVMzV4GGwX-QjHFc5CcTkEy7jLQQLaaHlvN2JU',
    },
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc002 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc001',
    method: 'POST',
    authType: 'Basic Auth',
    authTypeConfig: {
      username: 'test',
      password: 'p@ssword',
    },
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc003 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc003',
    method: 'POST',
    authType: 'No Auth',
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc004 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc004',
    method: 'POST',
    authType: 'No Auth',
    requestBody: {
      mediaType: 'multipart/form-data',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc005 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc005',
    method: 'GET',
    authType: 'No Auth',
    parameters: {
      queries: {
        mediaType: 'none',
        isArray: false,
        queryParams: [
          {
            name: 'age',
            type: 'integer',
          },
          {
            name: 'gender',
            type: 'integer',
          },
          {
            name: 'race',
            type: 'integer',
          },
          {
            name: 'income',
            type: 'integer',
          },
          {
            name: 'employment',
            type: 'integer',
          },
          {
            name: 'employment_length',
            type: 'integer',
          },
          {
            name: 'total_donated',
            type: 'integer',
          },
          {
            name: 'num_donation',
            type: 'integer',
          },
        ],
      },
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc006 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc006',
    urlParams:
      '/{age}/{gender}/{race}/{income}/{employment}/{employment_length}/{total_donated}/{num_donation}',
    method: 'GET',
    authType: 'No Auth',
    parameters: {
      paths: {
        mediaType: 'none',
        isArray: false,
        pathParams: [
          {
            name: 'age',
            type: 'integer',
          },
          {
            name: 'gender',
            type: 'integer',
          },
          {
            name: 'race',
            type: 'integer',
          },
          {
            name: 'income',
            type: 'integer',
          },
          {
            name: 'employment',
            type: 'integer',
          },
          {
            name: 'employment_length',
            type: 'integer',
          },
          {
            name: 'total_donated',
            type: 'integer',
          },
          {
            name: 'num_donation',
            type: 'integer',
          },
        ],
      },
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc007 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc007',
    method: 'POST',
    authType: 'No Auth',
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'application/json',
      type: 'integer',
      field: 'data',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc008 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc008',
    method: 'POST',
    authType: 'No Auth',
    additionalHeaders: [
      {
        name: 'foo',
        type: 'string',
        value: 'bar',
      },
    ],
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      connectionRetries: 3,
      batchStrategy: 'none',
      batchLimit: -1,
      maxConnections: -1,
    },
  },
};

export const saveConfigVariables_tc009 = {
  name: 'My test API',
  description: 'My test API description',
  modelType: 'Regression',
  modelAPI: {
    url: 'https://localhost:5000/predict/tc009',
    method: 'POST',
    authType: 'No Auth',
    requestBody: {
      mediaType: 'application/x-www-form-urlencoded',
      isArray: false,
      properties: [
        {
          field: 'age',
          type: 'integer',
        },
        {
          field: 'gender',
          type: 'integer',
        },
        {
          field: 'race',
          type: 'integer',
        },
        {
          field: 'income',
          type: 'integer',
        },
        {
          field: 'employment',
          type: 'integer',
        },
        {
          field: 'employment_length',
          type: 'integer',
        },
        {
          field: 'total_donated',
          type: 'integer',
        },
        {
          field: 'num_donation',
          type: 'integer',
        },
      ],
    },
    response: {
      statusCode: 200,
      mediaType: 'text/plain',
      type: 'integer',
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: 4,
      rateLimit: 5,
      rateLimitTimeout: 10,
      connectionRetries: 5,
      batchStrategy: 'multipart',
      batchLimit: 10,
      maxConnections: 3,
    },
  },
};

export const saveConfigVariables_result = {
  createModelAPI: {
    id: '64d5a78656d3605a78346770',
    name: 'My test API',
    description: 'My test API description',
    modelType: 'Classification',
    __typename: 'ModelFile',
  },
};
