import { notFound } from 'next/navigation';
import { Designer } from '@/app/canvas/components/designer';
import { PluginForGridLayout } from '@/app/canvas/types';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import {
  getPlugins,
  populatePluginsMdxBundles,
} from '@/lib/fetchApis/getPlugins';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';

type Props = {
  params: {
    id: string;
  };
};

export default async function TemplateDesignerPage({ params }: Props) {
  const { id } = await params;
  const templateId = Number(id);

  if (isNaN(templateId)) {
    notFound();
  }

  const [templateResult, pluginsResult] = await Promise.all([
    fetchTemplates({ id: templateId }),
    getPlugins({ groupByPluginId: false }),
  ]);

  if (!('data' in templateResult)) {
    notFound();
  }
  console.log(
    'Template API Response:',
    JSON.stringify(templateResult, null, 2)
  );
  const allTemplates = templateResult.data;
  const template = allTemplates[0] as ReportTemplate;

  if (!('data' in pluginsResult) || !Array.isArray(pluginsResult.data)) {
    throw new Error('Failed to fetch plugins');
  }

  const pluginsWithMdx = await populatePluginsMdxBundles(pluginsResult.data);
  console.log('pluginsWithMdx', pluginsWithMdx);

  // Map template pages to include full widget data with MDX
  const mappedPages = template.pages.map((page, pageIndex) => {
    const mappedWidgets = page.reportWidgets
      .map((templateWidget) => {
        // Find the plugin that contains this widget
        const [gid, cid] = templateWidget.widgetGID.split(':');
        const plugin = pluginsWithMdx.find((p) => p.gid === gid);

        if (!plugin) {
          console.warn(
            `No plugin found for template widget gid: ${templateWidget.widgetGID}`
          );
          return null;
        }

        // Find the widget in the plugin's widgets array
        const widget = plugin.widgets.find(
          (w) => w.gid === gid && w.cid === cid
        );
        if (!widget) {
          console.warn(
            `No widget found in plugin for gid: ${gid} and cid: ${cid}`
          );
          return null;
        }

        // Generate a random ID for the grid item
        const randomId = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now();

        // Create the gridItemId in the format: {gid}-{cid}-p{pageIndex}-{timestamp}-{randomId}
        const gridItemId = `${gid}-${cid}-p${pageIndex}-${timestamp}-${randomId}`;

        // Create a map of algorithm dependencies
        const algorithmDependencies =
          widget.dependencies?.map((dep) => ({
            gid: dep.gid || gid,
            cid: dep.cid,
          })) || [];

        // Create the full widget object with all necessary properties
        const fullWidget = {
          // First spread the original widget to get all base properties including MDX
          ...widget,

          // Then override/add template-specific properties
          gridItemId,
          properties: templateWidget.properties || widget.properties || [],
          layoutItemProperties: templateWidget.layoutItemProperties,

          // Ensure these properties are set correctly
          gid: gid,
          cid: cid,
          name: widget.name || cid,

          // Add algorithm dependencies
          dependencies: widget.dependencies || [],
          algorithms: algorithmDependencies,

          // Ensure MDX is preserved with proper structure
          mdx: widget.mdx
            ? {
                code: widget.mdx.code,
                frontmatter: widget.mdx.frontmatter || {},
              }
            : null,
        };

        console.log('Full widget with MDX:', {
          gid,
          cid,
          name: fullWidget.name,
          hasMdx: !!fullWidget.mdx,
          mdxCode: fullWidget.mdx?.code,
          mdxFrontmatter: fullWidget.mdx?.frontmatter,
          properties: fullWidget.properties,
          dependencies: fullWidget.dependencies,
          algorithms: fullWidget.algorithms,
        });

        return fullWidget;
      })
      .filter(Boolean); // Remove any null widgets

    // Map layouts to include the correct gridItemId
    const mappedLayouts = page.layouts.map((layout) => {
      const widget = mappedWidgets.find((w) => w && w.gridItemId === layout.i);
      if (!widget) return layout;

      return {
        ...layout,
        i: widget.gridItemId,
      };
    });

    return {
      ...page,
      layouts: mappedLayouts,
      reportWidgets: mappedWidgets,
    };
  });

  console.log('mappedPages', mappedPages[0].reportWidgets[0]?.mdx);

  return (
    <div className="h-screen w-full">
      <Designer
        flow={UserFlows.NewProjectWithExistingTemplate}
        project={{
          id: template.id,
          globalVars: template.globalVars,
          pages: mappedPages,
          templateId: String(template.id),
          projectInfo: {
            name: template.projectInfo.name,
            description: template.projectInfo.description,
            reportTitle: template.projectInfo.name,
            company: 'AIVerify',
          },
          testModelId: null,
          inputBlocks: [],
          testResults: [],
          created_at: template.created_at,
          updated_at: template.updated_at,
        }}
        allPluginsWithMdx={pluginsWithMdx}
        allTestResultsOnSystem={[]}
        allInputBlockDatasOnSystem={[]}
        disabled={true}
        pageNavigationMode="multi"
        initialState={{
          layouts: [],
          widgets: [],
          algorithmsOnReport: [],
          inputBlocksOnReport: [],
          gridItemToAlgosMap: undefined,
          gridItemToInputBlockDatasMap: undefined,
          currentPage: 0,
          showGrid: false,
          pageTypes: [],
          overflowParents: [],
        }}
      />
    </div>
  );
}
