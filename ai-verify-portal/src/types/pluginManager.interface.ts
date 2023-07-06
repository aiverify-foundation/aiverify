import AIFPlugin, { InputBlock, Algorithm } from './plugin.interface';
import ProjectTemplate from './projectTemplate.interface';

export default interface PluginManagerType {
  plugins: AIFPlugin[];
  inputBlocks: InputBlock[];
  algorithms: Algorithm[];
  templates: ProjectTemplate[];
  stockPlugins: string[];
}
