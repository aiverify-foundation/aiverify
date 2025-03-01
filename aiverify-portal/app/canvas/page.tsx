import { notFound } from 'next/navigation';
import { InputBlockData } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { getInputBlockDatas } from '@/lib/fetchApis/getInputBlockDatas';
import {
  getPlugins,
  populatePluginsMdxBundles,
} from '@/lib/fetchApis/getPlugins';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import { Designer } from './components/designer';
import { ParsedTestResults } from './types';

type UrlSearchParams = {
  searchParams: {
    flow: UserFlows;
    projectId: string;
    testResultIds?: string;
    iBlockIds?: string;
    templateIds?: string; // TODO: Add templateId to the URL params and fetch the template from the database. This should be done after template saving has been implemented.
  };
};

export default async function CanvasPage(props: UrlSearchParams) {
  const searchParams = await props.searchParams;
  const { flow, projectId, testResultIds, iBlockIds } = searchParams;
  const result = await getProjects({ ids: [projectId] });

  if (!projectId || flow == undefined || 'message' in result) {
    notFound();
  }

  const project = result.data[0];
  const plugins = await getPlugins({ groupByPluginId: false });
  const testResults = await getTestResults();
  const inputBlockDatas = await getInputBlockDatas();

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

  if ('message' in plugins) {
    throw new Error(plugins.message);
  }

  if (!Array.isArray(plugins.data)) {
    throw new Error('Invalid plugins data');
  }

  const pluginsWithMdx = await populatePluginsMdxBundles(plugins.data);

  return (
    <Designer
      flow={flow}
      project={project}
      allPluginsWithMdx={pluginsWithMdx}
      allTestResultsOnSystem={parsedTestResults}
      allInputBlockDatasOnSystem={inputBlockDatas}
      selectedTestResultsFromUrlParams={selectedTestResultsFromUrlParams}
      selectedInputBlockDatasFromUrlParams={
        selectedInputBlockDatasFromUrlParams
      }
    />
  );
}
