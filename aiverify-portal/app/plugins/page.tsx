import ActionButtons from '@/app/plugins/components/ActionButtons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { getAllPlugins } from '@/lib/fetchApis/getAllPlugins';
import PluginsList from './components/PluginList';

export default async function PluginsPage() {
  const plugins = await getAllPlugins();

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
      <PluginsList plugins={plugins} />
    </div>
  );
}
