import React from 'react';
import {
  AdditionalHeader,
  PathParam,
  QueryParam,
  Paths,
  Queries,
  Parameters,
  RequestBodyProperty,
  RequestBody,
  Response,
  RequestConfig,
  ModelAPI,
  ParameterMappings,
  TestModel,
  Column,
} from '../types';

describe('Type Definitions', () => {
  describe('AdditionalHeader', () => {
    it('should have correct structure', () => {
      const header: AdditionalHeader = {
        name: 'Authorization',
        type: 'string',
        value: 'Bearer token123',
      };

      expect(header.name).toBe('Authorization');
      expect(header.type).toBe('string');
      expect(header.value).toBe('Bearer token123');
    });
  });

  describe('PathParam', () => {
    it('should have correct structure', () => {
      const param: PathParam = {
        name: 'id',
        type: 'integer',
      };

      expect(param.name).toBe('id');
      expect(param.type).toBe('integer');
    });
  });

  describe('QueryParam', () => {
    it('should have correct structure', () => {
      const param: QueryParam = {
        name: 'limit',
        type: 'integer',
      };

      expect(param.name).toBe('limit');
      expect(param.type).toBe('integer');
    });
  });

  describe('Paths', () => {
    it('should have correct structure', () => {
      const paths: Paths = {
        mediaType: 'application/json',
        isArray: false,
        maxItems: 1,
        pathParams: [
          { name: 'id', type: 'integer' },
        ],
      };

      expect(paths.mediaType).toBe('application/json');
      expect(paths.isArray).toBe(false);
      expect(paths.maxItems).toBe(1);
      expect(paths.pathParams).toHaveLength(1);
      expect(paths.pathParams[0].name).toBe('id');
    });
  });

  describe('Queries', () => {
    it('should have correct structure', () => {
      const queries: Queries = {
        mediaType: 'application/json',
        name: 'query',
        isArray: false,
        maxItems: 10,
        queryParams: [
          { name: 'limit', type: 'integer' },
          { name: 'offset', type: 'integer' },
        ],
      };

      expect(queries.mediaType).toBe('application/json');
      expect(queries.name).toBe('query');
      expect(queries.isArray).toBe(false);
      expect(queries.maxItems).toBe(10);
      expect(queries.queryParams).toHaveLength(2);
    });
  });

  describe('Parameters', () => {
    it('should have correct structure', () => {
      const parameters: Parameters = {
        paths: {
          mediaType: 'application/json',
          isArray: false,
          maxItems: 1,
          pathParams: [],
        },
        queries: {
          mediaType: 'application/json',
          name: 'query',
          isArray: false,
          maxItems: 1,
          queryParams: [],
        },
      };

      expect(parameters.paths).toBeDefined();
      expect(parameters.queries).toBeDefined();
    });
  });

  describe('RequestBodyProperty', () => {
    it('should have correct structure', () => {
      const property: RequestBodyProperty = {
        field: 'input_data',
        type: 'object',
      };

      expect(property.field).toBe('input_data');
      expect(property.type).toBe('object');
    });
  });

  describe('RequestBody', () => {
    it('should have correct structure', () => {
      const requestBody: RequestBody = {
        mediaType: 'application/json',
        isArray: false,
        name: 'body',
        maxItems: 1,
        properties: [
          { field: 'input_data', type: 'object' },
        ],
      };

      expect(requestBody.mediaType).toBe('application/json');
      expect(requestBody.isArray).toBe(false);
      expect(requestBody.name).toBe('body');
      expect(requestBody.maxItems).toBe(1);
      expect(requestBody.properties).toHaveLength(1);
    });
  });

  describe('Response', () => {
    it('should have correct structure', () => {
      const response: Response = {
        statusCode: 200,
        mediaType: 'application/json',
        schema: { type: 'object' },
      };

      expect(response.statusCode).toBe(200);
      expect(response.mediaType).toBe('application/json');
      expect(response.schema).toEqual({ type: 'object' });
    });
  });

  describe('RequestConfig', () => {
    it('should have correct structure', () => {
      const config: RequestConfig = {
        sslVerify: true,
        connectionTimeout: 30,
        rateLimit: 100,
        rateLimitTimeout: 60,
        batchLimit: 10,
        connectionRetries: 3,
        maxConnections: 10,
        batchStrategy: 'sequential',
      };

      expect(config.sslVerify).toBe(true);
      expect(config.connectionTimeout).toBe(30);
      expect(config.rateLimit).toBe(100);
      expect(config.rateLimitTimeout).toBe(60);
      expect(config.batchLimit).toBe(10);
      expect(config.connectionRetries).toBe(3);
      expect(config.maxConnections).toBe(10);
      expect(config.batchStrategy).toBe('sequential');
    });
  });

  describe('ModelAPI', () => {
    it('should have correct structure', () => {
      const modelAPI: ModelAPI = {
        method: 'POST',
        url: 'https://api.example.com/predict',
        urlParams: '',
        authType: 'none',
        authTypeConfig: {},
        additionalHeaders: [],
        parameters: {
          paths: {
            mediaType: 'application/json',
            isArray: false,
            maxItems: 1,
            pathParams: [],
          },
          queries: {
            mediaType: 'application/json',
            name: 'query',
            isArray: false,
            maxItems: 1,
            queryParams: [],
          },
        },
        requestBody: {
          mediaType: 'application/json',
          isArray: false,
          name: 'body',
          maxItems: 1,
          properties: [],
        },
        response: {
          statusCode: 200,
          mediaType: 'application/json',
          schema: {},
        },
        requestConfig: {
          sslVerify: true,
          connectionTimeout: 30,
          rateLimit: 100,
          rateLimitTimeout: 60,
          batchLimit: 10,
          connectionRetries: 3,
          maxConnections: 10,
          batchStrategy: 'sequential',
        },
      };

      expect(modelAPI.method).toBe('POST');
      expect(modelAPI.url).toBe('https://api.example.com/predict');
      expect(modelAPI.authType).toBe('none');
      expect(modelAPI.parameters).toBeDefined();
      expect(modelAPI.requestBody).toBeDefined();
      expect(modelAPI.response).toBeDefined();
      expect(modelAPI.requestConfig).toBeDefined();
    });
  });

  describe('ParameterMappings', () => {
    it('should have correct structure', () => {
      const mappings: ParameterMappings = {
        requestBody: { input: 'data' },
        parameters: { id: '123' },
      };

      expect(mappings.requestBody).toEqual({ input: 'data' });
      expect(mappings.parameters).toEqual({ id: '123' });
    });
  });

  describe('TestModel', () => {
    it('should have correct structure', () => {
      const model: TestModel = {
        id: 1,
        name: 'Test Model',
        description: 'A test model',
        mode: 'file',
        modelType: 'classification',
        fileType: 'file',
        filename: 'model.zip',
        zip_hash: 'abc123',
        size: 1024,
        serializer: 'pickle',
        modelFormat: 'sklearn',
        modelAPI: {
          method: 'POST',
          url: 'https://api.example.com/predict',
          urlParams: '',
          authType: 'none',
          authTypeConfig: {},
          additionalHeaders: [],
          parameters: {
            paths: {
              mediaType: 'application/json',
              isArray: false,
              maxItems: 1,
              pathParams: [],
            },
            queries: {
              mediaType: 'application/json',
              name: 'query',
              isArray: false,
              maxItems: 1,
              queryParams: [],
            },
          },
          requestBody: {
            mediaType: 'application/json',
            isArray: false,
            name: 'body',
            maxItems: 1,
            properties: [],
          },
          response: {
            statusCode: 200,
            mediaType: 'application/json',
            schema: {},
          },
          requestConfig: {
            sslVerify: true,
            connectionTimeout: 30,
            rateLimit: 100,
            rateLimitTimeout: 60,
            batchLimit: 10,
            connectionRetries: 3,
            maxConnections: 10,
            batchStrategy: 'sequential',
          },
        },
        parameterMappings: {
          requestBody: {},
          parameters: {},
        },
        status: 'active',
        errorMessages: '',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(model.id).toBe(1);
      expect(model.name).toBe('Test Model');
      expect(model.description).toBe('A test model');
      expect(model.mode).toBe('file');
      expect(model.modelType).toBe('classification');
      expect(model.fileType).toBe('file');
      expect(model.filename).toBe('model.zip');
      expect(model.zip_hash).toBe('abc123');
      expect(model.size).toBe(1024);
      expect(model.serializer).toBe('pickle');
      expect(model.modelFormat).toBe('sklearn');
      expect(model.modelAPI).toBeDefined();
      expect(model.parameterMappings).toBeDefined();
      expect(model.status).toBe('active');
      expect(model.errorMessages).toBe('');
      expect(model.created_at).toBe('2023-01-01T00:00:00Z');
      expect(model.updated_at).toBe('2023-01-01T00:00:00Z');
    });
  });

  describe('Column', () => {
    it('should have correct structure with required fields', () => {
      const column: Column<TestModel> = {
        field: 'name',
        headerName: 'Name',
      };

      expect(column.field).toBe('name');
      expect(column.headerName).toBe('Name');
    });

    it('should have correct structure with optional fields', () => {
      const column: Column<TestModel> = {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        filterable: true,
        renderCell: (row) => React.createElement('span', null, row.status),
      };

      expect(column.field).toBe('status');
      expect(column.headerName).toBe('Status');
      expect(column.sortable).toBe(true);
      expect(column.filterable).toBe(true);
      expect(typeof column.renderCell).toBe('function');
    });

    it('should work with different field types', () => {
      const nameColumn: Column<TestModel> = {
        field: 'name',
        headerName: 'Name',
      };

      const idColumn: Column<TestModel> = {
        field: 'id',
        headerName: 'ID',
      };

      const statusColumn: Column<TestModel> = {
        field: 'status',
        headerName: 'Status',
      };

      expect(nameColumn.field).toBe('name');
      expect(idColumn.field).toBe('id');
      expect(statusColumn.field).toBe('status');
    });
  });
}); 