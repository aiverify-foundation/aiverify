import ActionButtons from '@/app/plugins/components/ActionButtons';
import { Plugin } from '@/app/plugins/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { getPlugins } from '@/lib/fetchApis/getPlugins';
import PluginsList from './components/PluginList';

export const dynamic = 'force-dynamic';

export default async function PluginsPage() {
  let pluginsResult;
  
  try {
    pluginsResult = await getPlugins();
  } catch (error) {
    // Handle API rejection/network errors
    pluginsResult = { message: 'Failed to load plugins' };
  }

  // Default to empty array if error occurs
  let plugins: Plugin[] = [];
  let errorMessage: string | null = null;

  if ('status' in pluginsResult) {
    if (pluginsResult.status === 'success') {
      // If successful, convert the API data to the expected Plugin type
      const apiData = Array.isArray(pluginsResult.data)
        ? pluginsResult.data
        : pluginsResult.data && typeof pluginsResult.data === 'object' 
          ? Object.values(pluginsResult.data)
          : [];

      // We need to cast the API result to the correct type
      plugins = apiData as unknown as Plugin[];
    } else {
      // Handle error from API
      errorMessage = pluginsResult.message;
    }
  } else if ('message' in pluginsResult) {
    // Handle error with message
    errorMessage = pluginsResult.message;
  }

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon
            name={IconName.Plug}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">Plugin Manager</h1>
            <h3 className="text-white">
              Manage plugins, their templates and algorithms.
            </h3>
          </div>
        </div>

        <ActionButtons />
      </div>

      {errorMessage ? (
        <div
          className="relative mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      ) : (
        <PluginsList plugins={plugins} />
      )}
    </div>
  );
}
