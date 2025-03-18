import { notFound } from 'next/navigation';
import { DynamicInputBlockList } from '@/app/inputs/components/DynamicInputBlockList';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';
import { getInputBlockDataByType } from '@/lib/fetchApis/getInputBlockData';

interface PageParams {
  gid: string;
  cid: string;
}

export default async function DynamicInputBlockPage({
  params,
}: {
  params: PageParams;
}) {
  // For server components, we can access params directly
  const { gid, cid } = params;

  // Get the input block definition
  const inputBlocks = await getAllInputBlocks();
  const inputBlock = inputBlocks.find(
    (block) => block.gid === gid && block.cid === cid
  );

  if (!inputBlock) {
    return notFound();
  }

  // Get the data for this input block type
  const inputBlockData = await getInputBlockDataByType({ gid, cid });

  return (
    <DynamicInputBlockList
      title={inputBlock.name}
      description={inputBlock.description || `Manage ${inputBlock.name} data`}
      inputBlock={inputBlock}
      inputBlockData={inputBlockData}
    />
  );
}
