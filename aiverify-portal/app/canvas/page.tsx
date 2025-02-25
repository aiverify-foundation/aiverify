import { getTestResults } from '@/lib/fetchApis/getAllTestResults';
import { getPlugins, populateMdxBundles } from '@/lib/fetchApis/getPlugins';
import { Designer } from './components/designer';



export default async function CanvasPage() {
  const plugins = await getPlugins({ groupByPluginId: false });
  const testResults = await getTestResults();

  const parsedTestResults = testResults.map(result => {
    try {
      return {
        ...result,
        output: JSON.parse(JSON.parse(result.output))
      };
    } catch (error) {
      console.error('Failed to parse test result output:', error);
      return {
        ...result,
        output: null
      };
    }
  });

  if ('message' in plugins) {
    return <div>{plugins.message}</div>;
  }
  if (!Array.isArray(plugins.data)) {
    return <div>Invalid plugins data</div>;
  }
  const pluginsWithMdx = await populateMdxBundles(plugins.data);
  return <Designer pluginsWithMdx={pluginsWithMdx} testResults={parsedTestResults} />;
}
