import {
  getPlugins,
  populatePluginsMdxBundles,
} from '@/lib/fetchApis/getPlugins';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import { Designer } from './components/designer';
import { ParsedTestResults } from './types';

type UrlSearchParams = {
  searchParams: {
    projectId?: string;
    testResultIds?: string;
    templateId?: string; // TODO: Add templateId to the URL params and fetch the template from the database. This should be done after template saving has been implemented.
  };
};

export default async function CanvasPage(props: UrlSearchParams) {
  const { projectId, testResultIds } = props.searchParams;
  const plugins = await getPlugins({ groupByPluginId: false });
  const testResults = await getTestResults();

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

  if ('message' in plugins) {
    throw new Error(plugins.message);
  }

  if (!Array.isArray(plugins.data)) {
    throw new Error('Invalid plugins data');
  }

  const pluginsWithMdx = await populatePluginsMdxBundles(plugins.data);

  return (
    <Designer
      allPluginsWithMdx={pluginsWithMdx}
      allTestResults={parsedTestResults}
      selectedTestResultsFromUrlParams={selectedTestResultsFromUrlParams}
    />
  );
}
