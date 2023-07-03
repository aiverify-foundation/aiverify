import Fuse from 'fuse.js';
import AIFPlugin, {
  ReportWidget,
  InputBlock,
  Algorithm,
} from 'src/types/plugin.interface';

type FuseResult<T> = Fuse.FuseResult<T>;

export function serializeSearchResult(
  list: FuseResult<AIFPlugin>[]
): AIFPlugin[] {
  return list.map((fuseResultItem) => fuseResultItem.item);
}

// Filters the subcomponents - means, the result will only show sub component with search matches.
// Currently not used. Keeping in case it's needed in future.
export function serializeSearchResultGranularSubComponents(
  list: FuseResult<AIFPlugin>[]
): AIFPlugin[] {
  let searchResult: AIFPlugin[] = [];
  searchResult = list.map((fuseResultItem) => {
    const { item: plugin } = fuseResultItem;
    const pluginWithFilteredComponents = { ...plugin };
    if (fuseResultItem.matches) {
      const matchedWidgets: ReportWidget[] = [];
      const matchedIBlocks: InputBlock[] = [];
      const matchedAlgos: Algorithm[] = [];
      const matchIndexesAlreadyAdded: number[] = [];

      fuseResultItem.matches.forEach((match) => {
        if (match.key === 'name' || match.key === 'description') {
          if (
            matchIndexesAlreadyAdded.indexOf(fuseResultItem.refIndex) === -1
          ) {
            if (plugin.reportWidgets)
              matchedWidgets.push(...plugin.reportWidgets);
            if (plugin.inputBlocks) matchedIBlocks.push(...plugin.inputBlocks);
            if (plugin.algorithms) matchedAlgos.push(...plugin.algorithms);
          }
          matchIndexesAlreadyAdded.push(fuseResultItem.refIndex);
        } else if (match.refIndex != undefined) {
          if (matchIndexesAlreadyAdded.indexOf(match.refIndex) === -1) {
            if (
              match.key &&
              match.key.startsWith('reportWidgets') &&
              plugin.reportWidgets
            ) {
              matchedWidgets.push({ ...plugin.reportWidgets[match.refIndex] });
            } else if (
              match.key &&
              match.key.startsWith('inputBlocks') &&
              plugin.inputBlocks
            ) {
              matchedIBlocks.push({ ...plugin.inputBlocks[match.refIndex] });
            } else if (
              match.key &&
              match.key.startsWith('algorithms') &&
              plugin.algorithms
            ) {
              matchedAlgos.push({ ...plugin.algorithms[match.refIndex] });
            }
            matchIndexesAlreadyAdded.push(match.refIndex);
          }
        }
      });

      pluginWithFilteredComponents.reportWidgets = matchedWidgets;
      pluginWithFilteredComponents.inputBlocks = matchedIBlocks;
      pluginWithFilteredComponents.algorithms = matchedAlgos;
    }
    return pluginWithFilteredComponents;
  });

  return searchResult;
}
