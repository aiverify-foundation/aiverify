// import { InputBlockChecklist, Checklist } from '@/app/inputs/utils/types';
import { InputBlockGroupData } from '@/app/types';

const endpointUrl = `${process.env.APIGW_HOST}/input_block_data/groups/`;

export async function getAllInputBlockGroups(
  gid: string | null = null
): Promise<InputBlockGroupData[]> {
  const res = await fetch(endpointUrl, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch inputs');
  }

  const allInputs: InputBlockGroupData[] = await res.json();

  if (gid) {
    return allInputs.filter((block) => block.gid === gid);
  } else {
    return allInputs;
  }
}
