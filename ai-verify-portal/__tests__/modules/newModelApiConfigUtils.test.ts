import {
  OpenApiDataTypes,
  ResponseSchemaForm,
  ResponseSchemaGQL,
} from 'src/modules/assets/modelAPIComponent/types';
import { replaceDynamicFieldnameWith_AIVDATA } from 'src/modules/assets/modelAPIComponent/utils/modelApiUtils';

describe('Model API Config Utility Functions', () => {
  it('should replace schema.properties.dataTestField with _AIVDATA_', () => {
    const response1 = {
      type: 'object',
      properties: {
        dataTestField: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    } as ResponseSchemaGQL;
    const expected1 = {
      type: 'object',
      properties: {
        _AIVDATA_: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    };
    const result = replaceDynamicFieldnameWith_AIVDATA(response1) as [
      ResponseSchemaForm,
      string,
      OpenApiDataTypes
    ];
    expect(result[0]).toMatchObject(expected1);
    expect(result[1]).toBe('dataTestField');
    expect(result[2]).toBe('string');
  });

  it('should replace schema.items.properties.dataTestField with _AIVDATA_', () => {
    const response2 = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dataTestField: {
            type: 'boolean',
          },
        },
      },
    } as ResponseSchemaGQL;
    const expected2 = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _AIVDATA_: {
            type: 'boolean',
          },
        },
      },
    };
    const result = replaceDynamicFieldnameWith_AIVDATA(response2) as [
      ResponseSchemaForm,
      string,
      OpenApiDataTypes
    ];
    expect(result[0]).toMatchObject(expected2);
    expect(result[1]).toBe('dataTestField');
    expect(result[2]).toBe('object');
  });

  it('should replace schema.properties.dataTestField with _AIVDATA_', () => {
    const response3 = {
      type: 'object',
      properties: {
        dataTestField: {
          type: 'string',
        },
      },
    } as ResponseSchemaGQL;
    const expected3 = {
      type: 'object',
      properties: {
        _AIVDATA_: {
          type: 'string',
        },
      },
    };
    const result = replaceDynamicFieldnameWith_AIVDATA(response3) as [
      ResponseSchemaForm,
      string,
      OpenApiDataTypes
    ];
    expect(result[0]).toMatchObject(expected3);
    expect(result[1]).toBe('dataTestField');
    expect(result[2]).toBe('string');
  });

  it('should return the same response with items', () => {
    const response = {
      type: 'array',
      items: {
        type: 'boolean',
      },
    } as ResponseSchemaGQL;
    const expected = response;
    const result = replaceDynamicFieldnameWith_AIVDATA(
      response
    ) as ResponseSchemaForm;
    expect(result).toMatchObject(expected);
  });

  it('should return the same response', () => {
    const response3 = {
      type: 'integer',
    } as ResponseSchemaGQL;
    const expected2 = response3;
    const result = replaceDynamicFieldnameWith_AIVDATA(
      response3
    ) as ResponseSchemaForm;
    expect(result).toMatchObject(expected2);
  });
});
