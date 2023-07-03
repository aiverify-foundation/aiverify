import Fuse from 'fuse.js';
import AIFPlugin, { ReportWidget } from 'src/types/plugin.interface';
import ProjectTemplate from 'src/types/projectTemplate.interface';

type FuseResult<T> = Fuse.FuseResult<T>;

export function serializeSearchResult(
  list: FuseResult<AIFPlugin>[]
): AIFPlugin[] {
  let pluginsResult: AIFPlugin[] = [];
  pluginsResult = list.map((fuseResultItem) => {
    const pluginWithWidgets = { ...fuseResultItem.item };
    if (fuseResultItem.matches) {
      const matchedWidgets: ReportWidget[] = [];
      const indexesUsed: number[] = [];
      fuseResultItem.matches.forEach((match) => {
        if (
          match.refIndex != undefined &&
          pluginWithWidgets.reportWidgets != undefined
        ) {
          if (indexesUsed.indexOf(match.refIndex) === -1) {
            matchedWidgets.push({
              ...pluginWithWidgets.reportWidgets[match.refIndex],
            });
            indexesUsed.push(match.refIndex);
          }
        }
      });
      if (matchedWidgets.length > 0) {
        pluginWithWidgets.reportWidgets = matchedWidgets;
      }
    }
    return pluginWithWidgets;
  });
  return pluginsResult;
}

export function serializeTemplatesSearchResult(
  list: FuseResult<ProjectTemplate>[]
): ProjectTemplate[] {
  return list.map((fuseResultItem) => fuseResultItem.item);
}
