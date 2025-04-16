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

export interface TemplateOutput {
  id: number;
  fromPlugin: boolean;
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
      };
      properties: Record<string, string> | null;
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
      tags: string[] | null;
      dependencies: {
        gid: string | null;
        cid: string;
        version: string | null;
      }[];
      mockdata:
        | {
            type: 'Algorithm' | 'InputBlock';
            gid: string | null;
            cid: string;
            data: Record<string, unknown>;
            artifacts?: string[];
          }[]
        | null;
      dynamicHeight: boolean;
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
  created_at: string;
  updated_at: string;
}

/**
 * Transforms the template output from the API into the state format
 */
export function transformTemplateOutputToState(
  template: TemplateOutput,
  pluginsWithMdx: PluginForGridLayout[]
) {
  // If this is a new template with no pages, create a default initial state
  if (!template.pages || template.pages.length === 0) {
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
  const layouts = template.pages.map((page) => page.layouts as Layout[]);
  const widgets = template.pages.map((page) =>
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

        // Create a minimal widget object with only essential data
        return {
          gid,
          cid,
          gridItemId: widget.key,
          name: pluginWidget.name,
          version: pluginWidget.version,
          author: pluginWidget.author,
          description: pluginWidget.description,
          widgetSize: pluginWidget.widgetSize,
          properties,
          tags: widget.tags,
          dependencies: pluginWidget.dependencies,
          mockdata: pluginWidget.mockdata,
          dynamicHeight: pluginWidget.dynamicHeight,
          layoutItemProperties: widget.layoutItemProperties,
          mdx: {
            code: pluginWidget.mdx.code,
            frontmatter: pluginWidget.mdx.frontmatter,
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
      // Get algorithms associated with this widget
      const algos = getWidgetAlgosFromPlugins(pluginsWithMdx, widget);

      // Map algorithms to grid items
      gridItemToAlgosMap[widget.gridItemId] = algos.map((algo) => ({
        gid: algo.gid,
        cid: algo.cid,
        testResultId: undefined,
      }));

      // Add algorithms to the report list without duplicates
      algos.forEach((algo) => {
        if (
          !algorithmsOnReport.some(
            (existing) => existing.gid === algo.gid && existing.cid === algo.cid
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

      // Map input blocks to grid items
      gridItemToInputBlockDatasMap[widget.gridItemId] = inputBlocks.map(
        (inputBlock) => ({
          gid: inputBlock.gid,
          cid: inputBlock.cid,
          inputBlockDataId: undefined,
        })
      );

      // Add input blocks to the report list without duplicates
      inputBlocks.forEach((inputBlock) => {
        if (
          !inputBlocksOnReport.some(
            (existing) =>
              existing.gid === inputBlock.gid && existing.cid === inputBlock.cid
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
    });
  });

  const pageTypes: ('grid' | 'overflow')[] = [];
  const overflowParents: Array<number | null> = [];

  // First, set all pages as 'grid' with null parent
  template.pages.forEach(() => {
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
