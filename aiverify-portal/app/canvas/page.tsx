import { fetchPlugins } from '@/lib/fetchApis/getAllPlugins';
import { Designer } from './components/designer';

export default async function CanvasPage() {
  const plugins = await fetchPlugins();
  if ('message' in plugins) {
    return <div>{plugins.message}</div>;
  }
  return <Designer plugins={plugins.data} />;
}
