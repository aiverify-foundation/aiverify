import { notFound } from 'next/navigation';
import {
  transformProjectOutputToState,
  ProjectOutput,
} from '@/app/canvas/utils/transformProjectOutputToState';
import {
  transformTemplateOutputToState,
  TemplateOutput,
} from '@/app/canvas/utils/transformTemplateOutputToState';
import { ReportTemplate, Page, Layout } from '@/app/templates/types';
import { InputBlockData } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { getInputBlockDatas } from '@/lib/fetchApis/getInputBlockDatas';
import {
  getPlugins,
  populatePluginsMdxBundles,
} from '@/lib/fetchApis/getPlugins';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import { Designer } from './components/designer';
import { State } from './components/hooks/pagesDesignReducer';
import { ParsedTestResults } from './types';

type UrlSearchParams = {
  searchParams: {
    flow: UserFlows;
    projectId?: string;
    templateId?: string;
    testResultIds?: string;
    iBlockIds?: string;
    mode?: 'view' | 'edit';
  };
};

export default async function CanvasPage(props: UrlSearchParams) {
  const searchParams = await props.searchParams;
  const {
    flow,
    projectId,
    templateId,
    testResultIds,
    iBlockIds,
    mode = 'edit',
  } = searchParams;

  // Get plugins and other data that's needed regardless of project/template
  const plugins = await getPlugins({ groupByPluginId: false });
  const testResults = await getTestResults();
  const inputBlockDatas = await getInputBlockDatas();

  if ('message' in plugins) {
    throw new Error(plugins.message);
  }

  if (!Array.isArray(plugins.data)) {
    throw new Error('Invalid plugins data');
  }

  const pluginsWithMdx = await populatePluginsMdxBundles(plugins.data);

  // Get either project or template data based on URL params
  let projectOrTemplate: ProjectOutput | TemplateOutput;

  if (projectId) {
    const result = await getProjects({ ids: [projectId] });
    if ('message' in result) {
      notFound();
    }
    projectOrTemplate = result.data[0] as ProjectOutput;
  } else if (templateId) {
    const result = await fetchTemplates();
    if ('message' in result) {
      notFound();
    }
    const template = result.data.find(
      (t: ReportTemplate) => t.id === parseInt(templateId, 10)
    );
    if (!template) {
      notFound();
    }
    // Convert ReportTemplate to TemplateOutput format
    projectOrTemplate = {
      id: template.id,
      fromPlugin: template.fromPlugin,
      pages: template.pages.map((page: Page) => ({
        layouts: page.layouts.map((layout: Layout) => ({
          ...layout,
          resizeHandles: layout.resizeHandles
            ? [layout.resizeHandles]
            : undefined,
        })),
        reportWidgets: page.reportWidgets,
      })),
      globalVars: template.globalVars,
      projectInfo: template.projectInfo,
      created_at: template.created_at,
      updated_at: template.updated_at,
    } as TemplateOutput;
  } else {
    notFound();
  }

  const isTemplate = templateId !== undefined;

  const parsedTestResults = testResults.map((result) => {
    try {
      return {
        ...result,
        output: JSON.parse(JSON.parse(result.output)),
      };
    } catch (error) {
      console.error('Failed to parse test result output:', error);
      return {
        ...result,
        output: null,
      };
    }
  });

  let selectedTestResultsFromUrlParams: ParsedTestResults[] = [];
  if (testResultIds != undefined) {
    const testIdsArray = testResultIds.split(',');
    selectedTestResultsFromUrlParams = parsedTestResults.filter((result) =>
      testIdsArray.includes(result.id.toString())
    );
  }

  let selectedInputBlockDatasFromUrlParams: InputBlockData[] = [];
  if (iBlockIds != undefined) {
    const iBlockIdsArray = iBlockIds.split(',');
    selectedInputBlockDatasFromUrlParams = inputBlockDatas.filter((data) =>
      iBlockIdsArray.includes(data.id.toString())
    );
  }

  // Initialize state with error handling for storage quota
  let initialState: State;
  try {
    initialState = isTemplate
      ? transformTemplateOutputToState(
          projectOrTemplate as TemplateOutput,
          pluginsWithMdx
        )
      : transformProjectOutputToState(
          projectOrTemplate as ProjectOutput,
          pluginsWithMdx
        );
  } catch (error) {
    console.error('Failed to initialize state:', error);
    // If we hit a storage quota error, try to initialize with minimal data
    initialState = {
      layouts: [[]],
      widgets: [[]],
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

  return (
    <Designer
      flow={flow}
      project={projectOrTemplate}
      initialState={initialState}
      allPluginsWithMdx={pluginsWithMdx}
      allTestResultsOnSystem={parsedTestResults}
      allInputBlockDatasOnSystem={inputBlockDatas}
      selectedTestResultsFromUrlParams={selectedTestResultsFromUrlParams}
      selectedInputBlockDatasFromUrlParams={
        selectedInputBlockDatasFromUrlParams
      }
      pageNavigationMode="multi"
      disabled={mode === 'view'}
      isTemplate={isTemplate}
    />
  );
}
