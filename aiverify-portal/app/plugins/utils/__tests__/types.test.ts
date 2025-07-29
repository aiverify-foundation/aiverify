import {
  Plugin,
  Algorithm,
  Widget,
  inputBlock,
  Template,
  UploadStatus,
  FileUpload,
} from '../types';

describe('Plugin Types', () => {
  describe('UploadStatus Type', () => {
    it('should accept valid upload status values', () => {
      const idleStatus: UploadStatus = 'idle';
      const uploadingStatus: UploadStatus = 'uploading';
      const successStatus: UploadStatus = 'success';
      const errorStatus: UploadStatus = 'error';

      expect(idleStatus).toBe('idle');
      expect(uploadingStatus).toBe('uploading');
      expect(successStatus).toBe('success');
      expect(errorStatus).toBe('error');
    });
  });

  describe('Algorithm Type', () => {
    it('should create a valid Algorithm object', () => {
      const algorithm: Algorithm = {
        cid: 'algo-1',
        gid: 'group-1',
        name: 'Test Algorithm',
        modelType: ['classification', 'regression'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test algorithm',
        tags: ['ml', 'test'],
        requireGroundTruth: true,
        language: 'python',
        script: 'test.py',
        module_name: 'test_module',
        inputSchema: {
          title: 'Input Schema',
          description: 'Test input schema',
          type: 'object',
          required: ['param1'],
          properties: {
            param1: {
              title: 'Parameter 1',
              description: 'First parameter',
              type: 'string',
            },
          },
        },
        outputSchema: {
          title: 'Output Schema',
          description: 'Test output schema',
          type: 'object',
          required: ['result'],
          minProperties: 1,
          properties: {
            result: {
              description: 'Algorithm result',
              type: 'string',
            },
          },
        },
        zip_hash: 'hash123',
      };

      expect(algorithm.cid).toBe('algo-1');
      expect(algorithm.modelType).toEqual(['classification', 'regression']);
      expect(algorithm.requireGroundTruth).toBe(true);
      expect(algorithm.inputSchema.required).toContain('param1');
      expect(algorithm.outputSchema.minProperties).toBe(1);
    });

    it('should handle null description in schemas', () => {
      const algorithm: Algorithm = {
        cid: 'algo-2',
        gid: 'group-2',
        name: 'Test Algorithm 2',
        modelType: ['classification'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test algorithm',
        tags: ['ml'],
        requireGroundTruth: false,
        language: 'python',
        script: 'test.py',
        module_name: 'test_module',
        inputSchema: {
          title: 'Input Schema',
          description: null,
          type: 'object',
          required: ['param1'],
          properties: {
            param1: {
              title: 'Parameter 1',
              description: 'First parameter',
              type: 'string',
            },
          },
        },
        outputSchema: {
          title: 'Output Schema',
          description: null,
          type: 'object',
          required: ['result'],
          minProperties: 1,
          properties: {
            result: {
              description: 'Algorithm result',
              type: 'string',
            },
          },
        },
        zip_hash: 'hash456',
      };

      expect(algorithm.inputSchema.description).toBeNull();
      expect(algorithm.outputSchema.description).toBeNull();
    });
  });

  describe('Widget Type', () => {
    it('should create a valid Widget object', () => {
      const widget: Widget = {
        cid: 'widget-1',
        name: 'Test Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test widget',
        widgetSize: {
          minW: 1,
          minH: 1,
          maxW: 4,
          maxH: 4,
        },
        properties: [
          {
            key: 'color',
            helper: 'Widget color',
            default: 'blue',
          },
        ],
        tags: 'visualization,chart',
        dependencies: [
          {
            gid: 'dep-group',
            cid: 'dep-component',
            version: '1.0.0',
          },
        ],
        mockdata: [
          {
            type: 'Algorithm',
            gid: 'mock-group',
            cid: 'mock-component',
            datapath: '/path/to/data',
          },
        ],
        dynamicHeight: true,
        gid: 'widget-group',
      };

      expect(widget.widgetSize.minW).toBe(1);
      expect(widget.properties).toHaveLength(1);
      expect(widget.properties![0].key).toBe('color');
      expect(widget.dependencies).toHaveLength(1);
      expect(widget.mockdata).toHaveLength(1);
      expect(widget.dynamicHeight).toBe(true);
    });

    it('should handle null values for optional properties', () => {
      const widget: Widget = {
        cid: 'widget-2',
        name: 'Minimal Widget',
        version: null,
        author: null,
        description: null,
        widgetSize: {
          minW: 2,
          minH: 2,
          maxW: 6,
          maxH: 6,
        },
        properties: null,
        tags: null,
        dependencies: [],
        mockdata: null,
        dynamicHeight: false,
        gid: 'widget-group-2',
      };

      expect(widget.version).toBeNull();
      expect(widget.author).toBeNull();
      expect(widget.description).toBeNull();
      expect(widget.properties).toBeNull();
      expect(widget.tags).toBeNull();
      expect(widget.mockdata).toBeNull();
    });
  });

  describe('inputBlock Type', () => {
    it('should create a valid inputBlock object', () => {
      const inputBlock: inputBlock = {
        cid: 'input-1',
        name: 'Test Input Block',
        version: '1.0.0',
        author: 'Test Author',
        tags: 'input,form',
        description: 'A test input block',
        group: 'form-inputs',
        groupNumber: 1,
        width: '100%',
        fullScreen: false,
        gid: 'input-group',
      };

      expect(inputBlock.cid).toBe('input-1');
      expect(inputBlock.groupNumber).toBe(1);
      expect(inputBlock.width).toBe('100%');
      expect(inputBlock.fullScreen).toBe(false);
    });

    it('should handle null values for optional properties', () => {
      const inputBlock: inputBlock = {
        cid: 'input-2',
        name: 'Minimal Input Block',
        version: null,
        author: null,
        tags: null,
        description: 'A minimal input block',
        group: null,
        groupNumber: null,
        width: '50%',
        fullScreen: true,
        gid: 'input-group-2',
      };

      expect(inputBlock.version).toBeNull();
      expect(inputBlock.author).toBeNull();
      expect(inputBlock.tags).toBeNull();
      expect(inputBlock.group).toBeNull();
      expect(inputBlock.groupNumber).toBeNull();
    });
  });

  describe('Template Type', () => {
    it('should create a valid Template object', () => {
      const template: Template = {
        cid: 'template-1',
        name: 'Test Template',
        description: 'A test template',
        author: 'Test Author',
        version: '1.0.0',
        tags: 'report,template',
        gid: 'template-group',
      };

      expect(template.cid).toBe('template-1');
      expect(template.name).toBe('Test Template');
      expect(template.description).toBe('A test template');
    });

    it('should handle null values for optional properties', () => {
      const template: Template = {
        cid: 'template-2',
        name: 'Minimal Template',
        description: 'A minimal template',
        author: null,
        version: null,
        tags: null,
        gid: 'template-group-2',
      };

      expect(template.author).toBeNull();
      expect(template.version).toBeNull();
      expect(template.tags).toBeNull();
    });
  });

  describe('FileUpload Type', () => {
    it('should create a valid FileUpload object', () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      
      const fileUpload: FileUpload = {
        file: mockFile,
        progress: 75,
        status: 'uploading',
        id: 'upload-123',
      };

      expect(fileUpload.file.name).toBe('test.zip');
      expect(fileUpload.progress).toBe(75);
      expect(fileUpload.status).toBe('uploading');
      expect(fileUpload.id).toBe('upload-123');
    });

    it('should handle different upload statuses', () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      
      const statuses: UploadStatus[] = ['idle', 'uploading', 'success', 'error'];
      
      statuses.forEach((status, index) => {
        const fileUpload: FileUpload = {
          file: mockFile,
          progress: index * 25,
          status,
          id: `upload-${index}`,
        };

        expect(fileUpload.status).toBe(status);
        expect(fileUpload.progress).toBe(index * 25);
      });
    });
  });

  describe('Plugin Type', () => {
    it('should create a valid Plugin object with all components', () => {
      const plugin: Plugin = {
        gid: 'plugin-1',
        version: '1.0.0',
        name: 'Test Plugin',
        author: 'Test Author',
        description: 'A comprehensive test plugin',
        url: 'https://example.com',
        meta: 'plugin metadata',
        is_stock: false,
        zip_hash: 'plugin-hash-123',
        algorithms: [
          {
            cid: 'algo-1',
            gid: 'plugin-1',
            name: 'Test Algorithm',
            modelType: ['classification'],
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test algorithm',
            tags: ['ml'],
            requireGroundTruth: true,
            language: 'python',
            script: 'test.py',
            module_name: 'test_module',
            inputSchema: {
              title: 'Input',
              description: 'Input schema',
              type: 'object',
              required: [],
              properties: {},
            },
            outputSchema: {
              title: 'Output',
              description: 'Output schema',
              type: 'object',
              required: [],
              minProperties: 0,
              properties: {
                result: {
                  description: 'Result',
                  type: 'string',
                },
              },
            },
            zip_hash: 'algo-hash',
          },
        ],
        widgets: [
          {
            cid: 'widget-1',
            name: 'Test Widget',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test widget',
            widgetSize: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
            properties: null,
            tags: null,
            dependencies: [],
            mockdata: null,
            dynamicHeight: false,
            gid: 'plugin-1',
          },
        ],
        input_blocks: [
          {
            cid: 'input-1',
            name: 'Test Input',
            version: '1.0.0',
            author: 'Test Author',
            tags: null,
            description: 'Test input block',
            group: null,
            groupNumber: null,
            width: '100%',
            fullScreen: false,
            gid: 'plugin-1',
          },
        ],
        templates: [
          {
            cid: 'template-1',
            name: 'Test Template',
            description: 'Test template',
            author: 'Test Author',
            version: '1.0.0',
            tags: null,
            gid: 'plugin-1',
          },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
      };

      expect(plugin.gid).toBe('plugin-1');
      expect(plugin.algorithms).toHaveLength(1);
      expect(plugin.widgets).toHaveLength(1);
      expect(plugin.input_blocks).toHaveLength(1);
      expect(plugin.templates).toHaveLength(1);
    });

    it('should create a valid Plugin object with empty component arrays', () => {
      const plugin: Plugin = {
        gid: 'plugin-2',
        version: '2.0.0',
        name: 'Minimal Plugin',
        author: null,
        description: null,
        url: null,
        meta: '',
        is_stock: true,
        zip_hash: 'minimal-hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z',
      };

      expect(plugin.algorithms).toHaveLength(0);
      expect(plugin.widgets).toHaveLength(0);
      expect(plugin.input_blocks).toHaveLength(0);
      expect(plugin.templates).toHaveLength(0);
      expect(plugin.is_stock).toBe(true);
    });
  });

  describe('Type validation scenarios', () => {
    it('should handle complex widget properties structure', () => {
      const widget: Widget = {
        cid: 'complex-widget',
        name: 'Complex Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A widget with complex properties',
        widgetSize: { minW: 2, minH: 2, maxW: 8, maxH: 6 },
        properties: [
          {
            key: 'chart_type',
            helper: 'Type of chart to display',
            default: 'bar',
          },
          {
            key: 'color_scheme',
            helper: 'Color scheme for the chart',
            default: null,
          },
        ],
        tags: 'chart,visualization,interactive',
        dependencies: [
          {
            gid: null,
            cid: 'dep-1',
            version: null,
          },
          {
            gid: 'group-1',
            cid: 'dep-2',
            version: '1.2.0',
          },
        ],
        mockdata: [
          {
            type: 'Algorithm',
            gid: null,
            cid: 'data-source',
            datapath: '/mock/data/path',
          },
        ],
        dynamicHeight: true,
        gid: 'widget-group',
      };

      expect(widget.properties).toHaveLength(2);
      expect(widget.properties![1].default).toBeNull();
      expect(widget.dependencies).toHaveLength(2);
      expect(widget.dependencies[0].gid).toBeNull();
      expect(widget.mockdata![0].gid).toBeNull();
    });

    it('should validate date string formats', () => {
      const plugin: Plugin = {
        gid: 'date-test',
        version: '1.0.0',
        name: 'Date Test Plugin',
        author: 'Test Author',
        description: 'Testing date formats',
        url: null,
        meta: '',
        is_stock: false,
        zip_hash: 'date-hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-15T14:30:45.123Z',
        updated_at: '2023-12-31T23:59:59.999Z',
      };

      expect(plugin.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(plugin.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
}); 