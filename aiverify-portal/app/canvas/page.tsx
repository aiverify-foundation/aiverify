import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  transformProjectOutputToState,
  ProjectOutput,
} from '@/app/canvas/utils/transformProjectOutputToState';
import {
  transformTemplateOutputToState,
  TemplateOutput,
} from '@/app/canvas/utils/transformTemplateOutputToState';
import { TestModel } from '@/app/models/utils/types';
import { ReportTemplate, Page, Layout } from '@/app/templates/types';
import { InputBlockData } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import {
  getInputBlockDatas,
  getInputBlockGroupDatas,
} from '@/lib/fetchApis/getInputBlockDatas';
import {
  getPlugins,
  populatePluginsMdxBundles,
} from '@/lib/fetchApis/getPlugins';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import { ClientDesigner } from './components/client-designer';
import { State } from './components/hooks/pagesDesignReducer';
import { ParsedTestResults } from './types';

type UrlSearchParams = {
  searchParams: Promise<{
    flow: UserFlows;
    projectId?: string;
    templateId?: string;
    testResultIds?: string;
    iBlockIds?: string;
    mode?: 'view' | 'edit';
  }>;
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

  // console.log('searchParams', searchParams);
  console.log('testResultIds', testResultIds);

  const useRealData = !!(
    projectId !== undefined && mode !== 'edit'
  );
  console.log('useRealData:', useRealData);

  // Get plugins and other data that's needed regardless of project/template
  const plugins = await getPlugins({ groupByPluginId: false });

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
    } as unknown as TemplateOutput;
  } else {
    notFound();
  }

  const isTemplate = templateId !== undefined;

  // Fetch model data here instead of in the Designer component
  let modelData: TestModel | null = null;
  if (!isTemplate && 'testModelId' in projectOrTemplate && projectOrTemplate.testModelId) {
    try {
      const models = await getTestModels();
      modelData = models.find(m => m.id === Number(projectOrTemplate.testModelId)) || null;
    } catch (error) {
      console.error('Failed to fetch model data:', error);
    }
  }

  // Initialize state with error handling for storage quota
  let initialState: State;
  try {
    initialState = {
      useRealData,
      ...(isTemplate
        ? transformTemplateOutputToState(
            projectOrTemplate as TemplateOutput,
            pluginsWithMdx
          )
        : transformProjectOutputToState(
            projectOrTemplate as ProjectOutput,
            pluginsWithMdx
          )),
    };

    // Set showGrid to false when in view mode
    if (mode === 'view') {
      initialState.showGrid = false;
    }
  } catch (error) {
    console.error('Failed to initialize state:', error);
    // If we hit a storage quota error, try to initialize with minimal data
    initialState = {
      useRealData,
      layouts: [[]],
      widgets: [[]],
      algorithmsOnReport: [],
      inputBlocksOnReport: [],
      gridItemToAlgosMap: {},
      gridItemToInputBlockDatasMap: {},
      currentPage: 0,
      showGrid: mode !== 'view', // Set showGrid based on mode
      pageTypes: ['grid' as const],
      overflowParents: [null],
    };
  }

  // console.log('initialState', initialState);
  console.log(
    'initialState.algorithmsOnReport',
    initialState.algorithmsOnReport
  );

  let selectedTestResultsFromUrlParams: ParsedTestResults[] = [];
  let parsedTestResults: ParsedTestResults[] = [];
  let selectedInputBlockDatasFromUrlParams: InputBlockData[] = [];
  let parsedInputBlockDatas: InputBlockData[] = [];

  if (useRealData) {
    // only query for test result not using mock data
    if (testResultIds && testResultIds.length > 0) {
      const testResults = await getTestResults();

      parsedTestResults = testResults.map((result) => {
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

      console.log('parsedTestResults', parsedTestResults);

      const testIdsArray = testResultIds.split(',');
      selectedTestResultsFromUrlParams = parsedTestResults.filter((result) =>
        testIdsArray.includes(result.id.toString())
      );
    }

    if (iBlockIds && iBlockIds.length > 0) {
      const inputBlockDatas = await getInputBlockDatas();
      const inputBlockGroupDatas = await getInputBlockGroupDatas();
      console.log('inputBlockGroupDatas', inputBlockGroupDatas);
      parsedInputBlockDatas = [
        ...inputBlockDatas,
        ...inputBlockGroupDatas.reduce((acc, grp) => {
          for (const ib of grp.input_blocks) {
            // console.log('ib', ib);
            acc.push({
              gid: grp.gid,
              cid: ib.cid,
              name: ib.name,
              data: ib.data,
              id: grp.id,
              group: grp.group,
              created_at: grp.created_at,
              updated_at: grp.updated_at,
            });
          }
          return acc;
        }, [] as InputBlockData[]),
      ];

      const iBlockIdsArray = iBlockIds.split(',');
      selectedInputBlockDatasFromUrlParams = parsedInputBlockDatas.filter(
        (data) => iBlockIdsArray.includes(data.id.toString())
      );
    }

    console.log('parsedInputBlockDatas', parsedInputBlockDatas);
    console.log(
      'selectedInputBlockDatasFromUrlParams',
      selectedInputBlockDatasFromUrlParams
    );
  }

  console.log(
    'selectedTestResultsFromUrlParams',
    selectedTestResultsFromUrlParams
  );

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          Loading canvas...
        </div>
      }>
      <ClientDesigner
        flow={flow}
        project={projectOrTemplate}
        initialState={initialState}
        allPluginsWithMdx={pluginsWithMdx}
        allTestResultsOnSystem={parsedTestResults}
        allInputBlockDatasOnSystem={parsedInputBlockDatas}
        selectedTestResultsFromUrlParams={selectedTestResultsFromUrlParams}
        selectedInputBlockDatasFromUrlParams={
          selectedInputBlockDatasFromUrlParams
        }
        pageNavigationMode="multi"
        disabled={mode === 'view'}
        isTemplate={isTemplate}
        modelData={modelData}
      />
    </Suspense>
  );
}
