import {
  Layout,
  LayoutItemProperties,
  WidgetProperties,
  ReportWidget,
  Page,
  ProjectInfo,
  ReportTemplate,
  ProcessedTemplateData,
  GlobalVar,
  UploadStatus,
  FileUpload,
} from '../types';

describe('Template Types', () => {
  describe('GlobalVar', () => {
    it('should have correct structure', () => {
      const globalVar: GlobalVar = {
        key: 'test-key',
        value: 'test-value',
      };

      expect(globalVar).toHaveProperty('key');
      expect(globalVar).toHaveProperty('value');
      expect(typeof globalVar.key).toBe('string');
      expect(typeof globalVar.value).toBe('string');
    });
  });

  describe('Layout', () => {
    it('should have correct structure with all required properties', () => {
      const layout: Layout = {
        i: 'item-1',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        maxW: 200,
        maxH: 200,
        minW: 50,
        minH: 50,
        static: false,
        isDraggable: true,
        isResizable: true,
        resizeHandles: ['se', 'sw'],
        isBounded: true,
      };

      expect(layout).toHaveProperty('i');
      expect(layout).toHaveProperty('x');
      expect(layout).toHaveProperty('y');
      expect(layout).toHaveProperty('w');
      expect(layout).toHaveProperty('h');
      expect(layout).toHaveProperty('maxW');
      expect(layout).toHaveProperty('maxH');
      expect(layout).toHaveProperty('minW');
      expect(layout).toHaveProperty('minH');
      expect(layout).toHaveProperty('static');
      expect(layout).toHaveProperty('isDraggable');
      expect(layout).toHaveProperty('isResizable');
      expect(layout).toHaveProperty('resizeHandles');
      expect(layout).toHaveProperty('isBounded');
    });

    it('should allow null resizeHandles', () => {
      const layout: Layout = {
        i: 'item-1',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        maxW: 200,
        maxH: 200,
        minW: 50,
        minH: 50,
        static: false,
        isDraggable: true,
        isResizable: true,
        resizeHandles: null,
        isBounded: true,
      };

      expect(layout.resizeHandles).toBeNull();
    });
  });

  describe('LayoutItemProperties', () => {
    it('should have correct structure with style properties', () => {
      const layoutItemProperties: LayoutItemProperties = {
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: '#ffffff',
        bgcolor: '#000000',
      };

      expect(layoutItemProperties).toHaveProperty('justifyContent');
      expect(layoutItemProperties).toHaveProperty('alignItems');
      expect(layoutItemProperties).toHaveProperty('textAlign');
      expect(layoutItemProperties).toHaveProperty('color');
      expect(layoutItemProperties).toHaveProperty('bgcolor');
    });

    it('should allow null color values', () => {
      const layoutItemProperties: LayoutItemProperties = {
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: null,
        bgcolor: null,
      };

      expect(layoutItemProperties.color).toBeNull();
      expect(layoutItemProperties.bgcolor).toBeNull();
    });
  });

  describe('WidgetProperties', () => {
    it('should allow dynamic key-value pairs', () => {
      const widgetProperties: WidgetProperties = {
        title: 'Test Widget',
        description: 'A test widget',
        color: '#ff0000',
        nullValue: null,
        undefinedValue: undefined,
      };

      expect(widgetProperties.title).toBe('Test Widget');
      expect(widgetProperties.description).toBe('A test widget');
      expect(widgetProperties.color).toBe('#ff0000');
      expect(widgetProperties.nullValue).toBeNull();
      expect(widgetProperties.undefinedValue).toBeUndefined();
    });
  });

  describe('ReportWidget', () => {
    it('should have correct structure', () => {
      const reportWidget: ReportWidget = {
        widgetGID: 'widget-123',
        key: 'test-key',
        layoutItemProperties: {
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#ffffff',
          bgcolor: '#000000',
        },
        properties: {
          title: 'Test Widget',
        },
      };

      expect(reportWidget).toHaveProperty('widgetGID');
      expect(reportWidget).toHaveProperty('key');
      expect(reportWidget).toHaveProperty('layoutItemProperties');
      expect(reportWidget).toHaveProperty('properties');
      expect(typeof reportWidget.widgetGID).toBe('string');
      expect(typeof reportWidget.key).toBe('string');
    });

    it('should allow null properties', () => {
      const reportWidget: ReportWidget = {
        widgetGID: 'widget-123',
        key: 'test-key',
        layoutItemProperties: {
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: null,
          bgcolor: null,
        },
        properties: null,
      };

      expect(reportWidget.properties).toBeNull();
    });
  });

  describe('Page', () => {
    it('should have correct structure with layouts and reportWidgets', () => {
      const page: Page = {
        layouts: [
          {
            i: 'item-1',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            maxW: 200,
            maxH: 200,
            minW: 50,
            minH: 50,
            static: false,
            isDraggable: true,
            isResizable: true,
            resizeHandles: ['se'],
            isBounded: true,
          },
        ],
        reportWidgets: [
          {
            widgetGID: 'widget-123',
            key: 'test-key',
            layoutItemProperties: {
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: '#ffffff',
              bgcolor: '#000000',
            },
            properties: {
              title: 'Test Widget',
            },
          },
        ],
      };

      expect(page).toHaveProperty('layouts');
      expect(page).toHaveProperty('reportWidgets');
      expect(Array.isArray(page.layouts)).toBe(true);
      expect(Array.isArray(page.reportWidgets)).toBe(true);
      expect(page.layouts).toHaveLength(1);
      expect(page.reportWidgets).toHaveLength(1);
    });

    it('should allow empty arrays', () => {
      const page: Page = {
        layouts: [],
        reportWidgets: [],
      };

      expect(page.layouts).toHaveLength(0);
      expect(page.reportWidgets).toHaveLength(0);
    });
  });

  describe('ProjectInfo', () => {
    it('should have correct structure', () => {
      const projectInfo: ProjectInfo = {
        name: 'Test Project',
        description: 'A test project description',
      };

      expect(projectInfo).toHaveProperty('name');
      expect(projectInfo).toHaveProperty('description');
      expect(typeof projectInfo.name).toBe('string');
      expect(typeof projectInfo.description).toBe('string');
    });
  });

  describe('ReportTemplate', () => {
    it('should have correct structure with all required properties', () => {
      const reportTemplate: ReportTemplate = {
        globalVars: [
          {
            key: 'test-key',
            value: 'test-value',
          },
        ],
        pages: [
          {
            layouts: [],
            reportWidgets: [],
          },
        ],
        projectInfo: {
          name: 'Test Template',
          description: 'A test template',
        },
        id: 1,
        fromPlugin: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(reportTemplate).toHaveProperty('globalVars');
      expect(reportTemplate).toHaveProperty('pages');
      expect(reportTemplate).toHaveProperty('projectInfo');
      expect(reportTemplate).toHaveProperty('id');
      expect(reportTemplate).toHaveProperty('fromPlugin');
      expect(reportTemplate).toHaveProperty('created_at');
      expect(reportTemplate).toHaveProperty('updated_at');
      expect(typeof reportTemplate.id).toBe('number');
      expect(typeof reportTemplate.fromPlugin).toBe('boolean');
    });
  });

  describe('ProcessedTemplateData', () => {
    it('should have correct structure without database fields', () => {
      const processedTemplateData: ProcessedTemplateData = {
        globalVars: [
          {
            key: 'test-key',
            value: 'test-value',
          },
        ],
        pages: [
          {
            layouts: [],
            reportWidgets: [],
          },
        ],
        projectInfo: {
          name: 'Test Template',
          description: 'A test template',
        },
      };

      expect(processedTemplateData).toHaveProperty('globalVars');
      expect(processedTemplateData).toHaveProperty('pages');
      expect(processedTemplateData).toHaveProperty('projectInfo');
      expect(processedTemplateData).not.toHaveProperty('id');
      expect(processedTemplateData).not.toHaveProperty('fromPlugin');
      expect(processedTemplateData).not.toHaveProperty('created_at');
      expect(processedTemplateData).not.toHaveProperty('updated_at');
    });
  });

  describe('UploadStatus', () => {
    it('should accept valid upload status values', () => {
      const statuses: UploadStatus[] = ['idle', 'uploading', 'success', 'error'];

      statuses.forEach((status) => {
        const uploadStatus: UploadStatus = status;
        expect(['idle', 'uploading', 'success', 'error']).toContain(
          uploadStatus
        );
      });
    });
  });

  describe('FileUpload', () => {
    it('should have correct structure with all required properties', () => {
      const file = new File(['test content'], 'test.json', {
        type: 'application/json',
      });

      const fileUpload: FileUpload = {
        file,
        progress: 50,
        status: 'uploading',
        id: 'upload-123',
        originalFile: file,
        processedData: {
          globalVars: [],
          pages: [],
          projectInfo: {
            name: 'Test',
            description: 'Test description',
          },
        },
      };

      expect(fileUpload).toHaveProperty('file');
      expect(fileUpload).toHaveProperty('progress');
      expect(fileUpload).toHaveProperty('status');
      expect(fileUpload).toHaveProperty('id');
      expect(fileUpload).toHaveProperty('originalFile');
      expect(fileUpload).toHaveProperty('processedData');
      expect(fileUpload.file).toBeInstanceOf(File);
      expect(typeof fileUpload.progress).toBe('number');
      expect(typeof fileUpload.id).toBe('string');
    });

    it('should allow optional properties to be undefined', () => {
      const file = new File(['test content'], 'test.json', {
        type: 'application/json',
      });

      const fileUpload: FileUpload = {
        file,
        progress: 0,
        status: 'idle',
        id: 'upload-123',
      };

      expect(fileUpload.originalFile).toBeUndefined();
      expect(fileUpload.processedData).toBeUndefined();
    });
  });
}); 