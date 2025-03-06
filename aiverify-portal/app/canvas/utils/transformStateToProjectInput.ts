import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { WidgetProperty, MockData } from '@/app/types';

interface ProjectInput {
  id?: number;
  templateId: string | null;
  pages: {
    layouts: Layout[];
    reportWidgets: {
      cid: string;
      name: string;
      version: string | null;
      author: string | null;
      description: string | null;
      widgetSize: {
        minW: number;
        minH: number;
        maxW: number;
        maxH: number;
      };
      properties: WidgetProperty[] | null;
      tags: string | null;
      dependencies: {
        gid: string | null;
        cid: string;
        version: string | null;
      }[];
      mockdata: MockData[] | null;
      dynamicHeight: boolean;
      gid: string;
      mdx: {
        code: string;
        frontmatter: Record<string, unknown> | undefined;
      };
      gridItemId: string;
      testResultCompositeId: {
        pluginGid: string;
        algoCid: string;
        timeCreated: string;
      } | null;
    }[];
  }[];
  globalVars: unknown[];
  projectInfo: {
    name: string;
    description: string;
    reportTitle: string;
    company: string;
  };
  testModelId: string | null;
  inputBlocks: {
    id: number;
    gid: string;
    cid: string;
    name: string;
    group: string;
    data: Record<string, unknown>;
  }[];
  testResults: {
    id: number;
    gid: string;
    cid: string;
    version: string;
    startTime: string;
    timeTaken: number;
    testArguments: {
      testDataset: string;
      mode: string;
      modelType: string;
      groundTruthDataset: string;
      groundTruth: string;
      algorithmArgs: string;
      modelFile: string;
    };
    output: string;
    artifacts?: string[];
    name: string;
  }[];
}

export function transformStateToProjectInput(
  state: {
    layouts: Layout[][];
    widgets: WidgetOnGridLayout[][];
    gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]>;
    gridItemToInputBlockDatasMap: Record<string, WidgetInputBlockIdentifier[]>;
  },
  projectInfo: {
    name: string;
    description: string;
    reportTitle: string;
    company: string;
  }
): ProjectInput {
  // Extract test results and input blocks from state
  const testResults = Object.entries(state.gridItemToAlgosMap).flatMap(
    ([_, identifiers]) =>
      identifiers
        .filter(
          (
            identifier
          ): identifier is WidgetAlgoAndResultIdentifier & {
            testResultId: number;
          } => identifier.testResultId !== undefined
        )
        .map((identifier) => ({
          id: identifier.testResultId,
          gid: identifier.gid,
          cid: identifier.cid,
          version: '', // These fields will be populated from the API
          startTime: '',
          timeTaken: 0,
          testArguments: {
            testDataset: '',
            mode: '',
            modelType: '',
            groundTruthDataset: '',
            groundTruth: '',
            algorithmArgs: '',
            modelFile: '',
          },
          output: '',
          name: '',
        }))
  );

  const inputBlocks = Object.entries(
    state.gridItemToInputBlockDatasMap
  ).flatMap(([_, identifiers]) =>
    identifiers
      .filter(
        (
          identifier
        ): identifier is WidgetInputBlockIdentifier & {
          inputBlockDataId: number;
        } => identifier.inputBlockDataId !== undefined
      )
      .map((identifier) => ({
        id: identifier.inputBlockDataId,
        gid: identifier.gid,
        cid: identifier.cid,
        name: '', // These fields will be populated from the API
        group: '',
        data: {},
      }))
  );

  // Construct pages array from layouts and widgets
  const pages = state.layouts.map((pageLayouts, pageIndex) => ({
    layouts: pageLayouts.map(
      (layout) =>
        ({
          ...layout,
          maxW: layout.maxW ?? 12,
          maxH: layout.maxH ?? 36,
          minW: layout.minW ?? 1,
          minH: layout.minH ?? 1,
          isDraggable: true,
          isResizable: true,
          resizeHandles: ['se'],
          isBounded: true,
        }) as Layout
    ),
    reportWidgets: state.widgets[pageIndex].map((widget) => ({
      ...widget,
      properties: widget.properties ?? [],
      tags: widget.tags ?? null,
      dependencies: widget.dependencies ?? [],
      mockdata: widget.mockdata ?? null,
    })),
  }));

  return {
    templateId: null,
    pages,
    globalVars: [],
    projectInfo,
    testModelId: null,
    inputBlocks,
    testResults,
  };
}
