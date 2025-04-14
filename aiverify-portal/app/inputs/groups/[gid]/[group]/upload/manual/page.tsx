import _ from 'lodash';
import { InputBlockGroup } from '@/app/inputs/utils/types';
import { getPlugin } from '@/lib/fetchApis/getAllPlugins';
import { GroupDataProvider } from '../context/ChecklistsContext';
import ChecklistsPageContent from './pageContent';

export interface InputBlockGroupPageProps {
  gid: string;
  group: string;
}

export default async function InputBlockGroupPage({
  params,
}: {
  params: Promise<InputBlockGroupPageProps>;
}) {
  // let { gid, group } = use(params);
  const { gid, group } = await params;
  const decodedGroup = decodeURI(group);
  const plugin = await getPlugin(decodeURI(gid));
  const blocks = plugin.input_blocks.filter((ib) => ib.group === decodedGroup);
  blocks.sort((a, b) => {
    if (_.isNil(a.groupNumber) || _.isNil(b.groupNumber)) return 0;
    if (isNaN(a.groupNumber) || isNaN(b.groupNumber)) return 0;
    return a.groupNumber - b.groupNumber;
  });
  const groupData: InputBlockGroup = {
    gid: gid,
    groupName: decodedGroup,
    data: {},
    inputBlocks: blocks,
  };

  return (
    <GroupDataProvider>
      <ChecklistsPageContent
        // plugin={plugin}
        group={groupData}
      />
    </GroupDataProvider>
  );
}
