import Fuse from 'fuse.js';
import Project from 'src/types/project.interface';

type FuseResult<T> = Fuse.FuseResult<T>;

export function serializeSearchResult(list: FuseResult<Project>[]): Project[] {
  let projectsResult: Project[] = [];
  projectsResult = list.map((fuseResultItem) => fuseResultItem.item);
  return projectsResult;
}
