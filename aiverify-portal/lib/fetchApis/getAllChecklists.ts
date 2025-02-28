import { InputBlock, Checklist } from '@/app/inputs/utils/types';

const endpointUrl = `${process.env.APIGW_HOST}/input_block_data`;

export async function getAllChecklists(): Promise<Checklist[]> {
  const res = await fetch(endpointUrl, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch inputs');
  }

  const allInputs: InputBlock[] = await res.json();

  return allInputs.filter(
    (block) => block.gid === 'aiverify.stock.process_checklist'
  ) as Checklist[];
}
