import { InputBlock, FairnessTree } from '@/app/inputs/utils/types';

export async function getAllFairnessTrees(): Promise<FairnessTree[]> {
  const res = await fetch(`http://127.0.0.1:4000/input_block_data/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch inputs');
  }

  const allInputs: InputBlock[] = await res.json();

  return allInputs.filter(
    (block) =>
      block.gid === 'aiverify.stock.fairness_metrics_toolbox_for_classification'
  ) as FairnessTree[];
}