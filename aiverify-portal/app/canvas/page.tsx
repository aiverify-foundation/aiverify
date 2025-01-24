import { getPlugins } from '@/lib/fetchApis/getPlugins';
import { Designer } from './components/designer';

export default async function CanvasPage() {
  const plugins = await getPlugins({ groupByPluginId: false });
  if ('message' in plugins) {
    return <div>{plugins.message}</div>;
  }
  if (!Array.isArray(plugins.data)) {
    return <div>Invalid plugins data</div>;
  }
  return <Designer plugins={plugins.data} />;
}
