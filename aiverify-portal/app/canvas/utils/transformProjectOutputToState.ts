import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetProperty, MockData } from '@/app/types';

interface ProjectOutput {
  id: number;
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

/**
 * Transforms the project output from the API into the state format
 */
export function transformProjectOutputToState(project: ProjectOutput) {
  // Create layouts and widgets arrays from pages
  const layouts = project.pages.map((page) => page.layouts);
  const widgets = project.pages.map((page) => page.reportWidgets);

  // Create gridItemToAlgosMap from testResults
  const gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]> =
    {};
  project.testResults.forEach((result) => {
    const widget = widgets
      .flat()
      .find((w) => w.testResultCompositeId?.algoCid === result.cid);
    if (widget) {
      if (!gridItemToAlgosMap[widget.gridItemId]) {
        gridItemToAlgosMap[widget.gridItemId] = [];
      }
      gridItemToAlgosMap[widget.gridItemId].push({
        gid: result.gid,
        cid: result.cid,
        testResultId: result.id,
      });
    }
  });

  // Create gridItemToInputBlockDatasMap from inputBlocks
  const gridItemToInputBlockDatasMap: Record<
    string,
    WidgetInputBlockIdentifier[]
  > = {};
  project.inputBlocks.forEach((block) => {
    const widget = widgets
      .flat()
      .find((w) =>
        w.mockdata?.some((m) => m.type === 'InputBlock' && m.cid === block.cid)
      );
    if (widget) {
      if (!gridItemToInputBlockDatasMap[widget.gridItemId]) {
        gridItemToInputBlockDatasMap[widget.gridItemId] = [];
      }
      gridItemToInputBlockDatasMap[widget.gridItemId].push({
        gid: block.gid,
        cid: block.cid,
        inputBlockDataId: block.id,
      });
    }
  });

  // Calculate pageTypes and overflowParents based on layout heights
  const pageTypes: ('grid' | 'overflow')[] = project.pages.map(() => 'grid');
  const overflowParents: Array<number | null> = project.pages.map(() => null);

  return {
    layouts,
    widgets,
    algorithmsOnReport: [], // This will be populated from widget registry
    inputBlocksOnReport: [], // This will be populated from widget registry
    gridItemToAlgosMap,
    gridItemToInputBlockDatasMap,
    currentPage: 0,
    showGrid: true,
    pageTypes,
    overflowParents,
  };
}
