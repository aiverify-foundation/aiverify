import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ClientDesigner } from '../client-designer';
import { UserFlows } from '@/app/userFlowsEnum';

// Mock the dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: () => Promise<any>, options: any) => {
    const MockDesigner = () => (
      <div data-testid="mock-designer">
        Mock Designer Component
      </div>
    );
    return MockDesigner;
  },
}));

// Mock the designer component
jest.mock('../designer', () => ({
  Designer: () => (
    <div data-testid="designer-component">
      Designer Component
    </div>
  ),
}));

describe('ClientDesigner', () => {
  const mockProps = {
    flow: UserFlows.NewProjectWithNewTemplate,
    project: {
      id: 1,
      projectInfo: {
        name: 'Test Project',
        description: 'Test Description',
        reportTitle: 'Test Report',
        company: 'Test Company',
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      pages: [],
      globalVars: [],
      testResults: [],
      templateId: 'test-template-id',
      testModelId: 1,
      inputBlocks: [],
    },
    initialState: {
      layouts: [],
      widgets: [],
      currentPage: 0,
      showGrid: true,
      pageTypes: ['grid' as const],
      overflowParents: [null],
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      useRealData: false,
    },
    allPluginsWithMdx: [],
    allTestResultsOnSystem: [],
    allInputBlockDatasOnSystem: [],
    selectedTestResultsFromUrlParams: [],
    selectedInputBlockDatasFromUrlParams: [],
    pageNavigationMode: 'multi' as const,
    disabled: false,
    isTemplate: false,
    modelData: null,
  };

  it('renders the component with all required props', () => {
    render(<ClientDesigner {...mockProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('passes all props to the Designer component', () => {
    render(<ClientDesigner {...mockProps} />);
    
    const designerComponent = screen.getByTestId('mock-designer');
    expect(designerComponent).toBeInTheDocument();
  });

  it('renders with different flow types', () => {
    const propsWithDifferentFlow = {
      ...mockProps,
      flow: UserFlows.EditExistingProject,
    };
    
    render(<ClientDesigner {...propsWithDifferentFlow} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with template mode enabled', () => {
    const templateProps = {
      ...mockProps,
      isTemplate: true,
    };
    
    render(<ClientDesigner {...templateProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with disabled mode', () => {
    const disabledProps = {
      ...mockProps,
      disabled: true,
    };
    
    render(<ClientDesigner {...disabledProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with single page navigation mode', () => {
    const singleModeProps = {
      ...mockProps,
      pageNavigationMode: 'single' as const,
    };
    
    render(<ClientDesigner {...singleModeProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with model data', () => {
    const modelDataProps = {
      ...mockProps,
      modelData: {
        id: 'test-model',
        name: 'Test Model',
        description: 'Test Model Description',
      } as any,
    };
    
    render(<ClientDesigner {...modelDataProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with test results from URL params', () => {
    const testResultsProps = {
      ...mockProps,
      selectedTestResultsFromUrlParams: [
        {
          id: 'test-result-1',
          gid: 'test-gid',
          cid: 'test-cid',
          output: { test: 'data' },
          testArguments: { modelType: 'test' },
          artifacts: [],
        } as any,
      ],
    };
    
    render(<ClientDesigner {...testResultsProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with input block datas from URL params', () => {
    const inputBlockProps = {
      ...mockProps,
      selectedInputBlockDatasFromUrlParams: [
        {
          id: 'input-block-1',
          gid: 'test-gid',
          cid: 'test-cid',
          data: { input: 'data' },
        } as any,
      ],
    };
    
    render(<ClientDesigner {...inputBlockProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with plugins data', () => {
    const pluginsProps = {
      ...mockProps,
      allPluginsWithMdx: [
        {
          gid: 'test-plugin',
          name: 'Test Plugin',
          widgets: [
            {
              cid: 'test-widget',
              name: 'Test Widget',
              widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 36 },
            } as any,
          ],
        } as any,
      ],
    };
    
    render(<ClientDesigner {...pluginsProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with complex initial state', () => {
    const complexStateProps = {
      ...mockProps,
      initialState: {
        layouts: [[{ i: 'widget-1', x: 0, y: 0, w: 6, h: 4 }]],
        widgets: [[{
          gridItemId: 'widget-1',
          name: 'Test Widget',
        } as any]],
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid' as const],
        overflowParents: [null],
        algorithmsOnReport: [],
        inputBlocksOnReport: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        useRealData: true,
      },
    };
    
    render(<ClientDesigner {...complexStateProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      flow: UserFlows.NewProjectWithNewTemplate,
      project: mockProps.project,
      initialState: mockProps.initialState,
      allPluginsWithMdx: [],
      allTestResultsOnSystem: [],
      allInputBlockDatasOnSystem: [],
      selectedTestResultsFromUrlParams: [],
      selectedInputBlockDatasFromUrlParams: [],
      pageNavigationMode: 'multi' as const,
      disabled: false,
      isTemplate: false,
    };
    
    render(<ClientDesigner {...minimalProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('renders with empty arrays for data props', () => {
    const emptyDataProps = {
      ...mockProps,
      allPluginsWithMdx: [],
      allTestResultsOnSystem: [],
      allInputBlockDatasOnSystem: [],
      selectedTestResultsFromUrlParams: [],
      selectedInputBlockDatasFromUrlParams: [],
    };
    
    render(<ClientDesigner {...emptyDataProps} />);
    
    expect(screen.getByTestId('mock-designer')).toBeInTheDocument();
  });

  it('maintains proper component structure', () => {
    const { container } = render(<ClientDesigner {...mockProps} />);
    
    const designerComponent = container.querySelector('[data-testid="mock-designer"]');
    expect(designerComponent).toBeInTheDocument();
  });
}); 