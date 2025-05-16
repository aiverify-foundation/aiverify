import { Layout } from 'react-grid-layout';
import {
  WidgetAlgoAndResultIdentifier,
  WidgetInputBlockIdentifier,
} from '@/app/canvas/components/hooks/pagesDesignReducer';
import { WidgetOnGridLayout, PluginForGridLayout } from '@/app/canvas/types';
import { findWidgetFromPluginsById } from '@/app/canvas/utils/findWidgetFromPluginsById';
import { getWidgetAlgosFromPlugins } from '@/app/canvas/utils/getWidgetAlgosFromPlugins';
import { getWidgetInputBlocksFromPlugins } from '@/app/canvas/utils/getWidgetInputBlocksFromPlugins';
import { Algorithm, InputBlock } from '@/app/types';

type ResizeHandle = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';

export interface ProjectOutput {
  id: number;
  templateId: string | null;
  pages: {
    layouts: {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      maxW: number;
      maxH: number;
      minW: number;
      minH: number;
      static: boolean;
      isDraggable: boolean;
      isResizable: boolean;
      resizeHandles: ResizeHandle[] | undefined;
      isBounded: boolean;
    }[];
    reportWidgets: {
      widgetGID: string;
      key: string;
      layoutItemProperties: {
        justifyContent: string;
        alignItems: string;
        textAlign: string;
        color: string | null;
        bgcolor: string | null;
      } | null;
      properties: Record<string, string> | null;
      name?: string;
      version?: string | null;
      author?: string | null;
      description?: string | null;
      widgetSize?: {
        minW: number;
        minH: number;
        maxW: number;
        maxH: number;
      };
      tags?: string[] | null;
      dependencies?: {
        gid: string | null;
        cid: string;
        version: string | null;
      }[];
      mockdata?:
        | {
            type: 'Algorithm' | 'InputBlock';
            gid: string | null;
            cid: string;
            data: Record<string, unknown>;
            artifacts?: string[];
          }[]
        | null;
      dynamicHeight?: boolean;
    }[];
  }[];
  globalVars: {
    key: string;
    value: string;
  }[];
  projectInfo: {
    name: string;
    description: string;
    reportTitle: string;
    company: string;
  };
  testModelId: number | null;
  inputBlocks: {
    id: number;
    gid: string;
    cid: string;
  }[];
  testResults: {
    id: number;
    gid: string;
    cid: string;
  }[];
  created_at: string;
  updated_at: string;
}

/**
 * Transforms the project output from the API into the state format
 */
export function transformProjectOutputToState(
  project: ProjectOutput,
  pluginsWithMdx: PluginForGridLayout[]
) {
  // If this is a new project with no pages, create a default initial state
  if (!project.pages || project.pages.length === 0) {
    return {
      layouts: [[]], // One empty page
      widgets: [[]], // One empty page with no widgets
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      currentPage: 0,
      showGrid: true,
      pageTypes: ['grid' as const],
      overflowParents: [null],
    };
  }

  // Create layouts and widgets arrays from pages
  const layouts = project.pages.map((page) => page.layouts as Layout[]);
  const widgets = project.pages.map((page) =>
    page.reportWidgets
      .map((widget) => {
        // Transform properties from Record<string, string> to WidgetProperty[]
        const properties = widget.properties
          ? Object.entries(widget.properties).map(([key, value]) => ({
              key,
              helper: '', // Default helper text
              default: value,
              value,
            }))
          : null;

        // Find the widget definition from available plugins to get MDX and other properties
        const [gid, cid] = widget.widgetGID.split(':');
        const pluginWidget = findWidgetFromPluginsById(
          pluginsWithMdx,
          gid,
          cid
        );
        if (!pluginWidget) {
          console.error(`Widget not found - gid: ${gid} - cid: ${cid}`);
          return null;
        }

        // Create a widget object with data from both the project and the plugin
        // Use plugin data as fallback when project data is missing
        return {
          gid,
          cid,
          gridItemId: widget.key,
          name: widget.name || pluginWidget.name,
          version: widget.version || pluginWidget.version,
          author: widget.author || pluginWidget.author,
          description: widget.description || pluginWidget.description,
          widgetSize: widget.widgetSize || pluginWidget.widgetSize,
          properties,
          tags: widget.tags || pluginWidget.tags,
          dependencies: widget.dependencies || pluginWidget.dependencies,
          mockdata: widget.mockdata || pluginWidget.mockdata,
          dynamicHeight:
            widget.dynamicHeight !== undefined
              ? widget.dynamicHeight
              : pluginWidget.dynamicHeight,
          layoutItemProperties: widget.layoutItemProperties || {
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            textAlign: 'left',
            color: null,
            bgcolor: null,
          },
          // Only include essential MDX data
          mdx: {
            code: pluginWidget.mdx.code,
            frontmatter: pluginWidget.mdx.frontmatter,
            // Exclude any large data structures from MDX
            raw: undefined,
            compiledSource: undefined,
            scope: undefined,
          },
          result: {},
        } as WidgetOnGridLayout;
      })
      .filter((widget): widget is WidgetOnGridLayout => widget !== null)
  );

  // Initialize algorithms and input blocks with minimal data
  const algorithmsOnReport: Algorithm[] = [];
  const inputBlocksOnReport: InputBlock[] = [];
  const gridItemToAlgosMap: Record<string, WidgetAlgoAndResultIdentifier[]> =
    {};
  const gridItemToInputBlockDatasMap: Record<
    string,
    WidgetInputBlockIdentifier[]
  > = {};

  // Process each widget to collect algorithms and input blocks
  widgets.forEach((pageWidgets) => {
    pageWidgets.forEach((widget) => {
      try {
        // Get algorithms associated with this widget
        const algos = getWidgetAlgosFromPlugins(pluginsWithMdx, widget);

        // Map algorithms to grid items with their test result IDs
        gridItemToAlgosMap[widget.gridItemId] = algos.map((algo) => ({
          gid: algo.gid,
          cid: algo.cid,
          testResultId: project.testResults.find(
            (result) => result.gid === algo.gid && result.cid === algo.cid
          )?.id,
        }));

        // Add algorithms to the report list without duplicates
        algos.forEach((algo) => {
          if (
            !algorithmsOnReport.some(
              (existing) =>
                existing.gid === algo.gid && existing.cid === algo.cid
            )
          ) {
            algorithmsOnReport.push({
              gid: algo.gid,
              cid: algo.cid,
              name: algo.name,
              modelType: algo.modelType,
              version: algo.version,
              author: algo.author,
              description: algo.description,
              tags: algo.tags,
              requireGroundTruth: algo.requireGroundTruth,
              language: algo.language,
              script: algo.script,
              module_name: algo.module_name,
              inputSchema: algo.inputSchema,
              outputSchema: algo.outputSchema,
              zip_hash: algo.zip_hash,
            });
          }
        });

        // Get input blocks associated with this widget
        const inputBlocks = getWidgetInputBlocksFromPlugins(
          pluginsWithMdx,
          widget
        );

        console.log('project.inputBlocks:', project.inputBlocks);
        console.log('Real inputBlocks:', inputBlocks);

        // Map input blocks to grid items with their input block data IDs
        gridItemToInputBlockDatasMap[widget.gridItemId] = inputBlocks.map(
          (inputBlock) => ({
            gid: inputBlock.gid,
            cid: inputBlock.cid,
            // inputBlockDataId: inputBlocks.find(
            //   (block) =>
            //     block.gid === inputBlock.gid && block.cid === inputBlock.cid
            // )?.id,
          })
        );

        // Add input blocks to the report list without duplicates
        inputBlocks.forEach((inputBlock) => {
          if (
            !inputBlocksOnReport.some(
              (existing) =>
                existing.gid === inputBlock.gid &&
                existing.cid === inputBlock.cid
            )
          ) {
            inputBlocksOnReport.push({
              gid: inputBlock.gid,
              cid: inputBlock.cid,
              name: inputBlock.name,
              version: inputBlock.version,
              author: inputBlock.author,
              tags: inputBlock.tags,
              description: inputBlock.description,
              group: inputBlock.group,
              groupNumber: inputBlock.groupNumber,
              width: inputBlock.width,
              fullScreen: inputBlock.fullScreen,
            });
          }
        });
      } catch (error) {
        console.error('Error processing widget:', widget, error);
      }
    });
  });

  // Calculate pageTypes and overflowParents
  // For the specific case in the example, we want to set the first page as 'grid'
  // and the second page as 'overflow' with parent 0
  const pageTypes: ('grid' | 'overflow')[] = [];
  const overflowParents: Array<number | null> = [];

  // First, set all pages as 'grid' with null parent
  project.pages.forEach(() => {
    pageTypes.push('grid');
    overflowParents.push(null);
  });

  return {
    layouts,
    widgets,
    algorithmsOnReport,
    inputBlocksOnReport,
    gridItemToAlgosMap,
    gridItemToInputBlockDatasMap,
    currentPage: 0,
    showGrid: true,
    pageTypes,
    overflowParents,
  };
}
