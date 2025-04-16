import { notFound } from 'next/navigation';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';
import { getInputBlockDataByType } from '@/lib/fetchApis/getInputBlockData';
import '@/app/inputs/[gid]/[cid]/components/DecisionTree.css';
import DynamicInputRenderer from './components/DynamicInputRenderer';

interface PageParams {
  gid: string;
  cid: string;
}

interface SearchParams {
  projectId?: string;
  flow?: string;
}

export default async function DynamicInputBlockPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  // For server components, we can access params directly
  const { gid, cid } = await params;
  const parsedSearchParams = await searchParams;

  // Get the input block definition
  const inputBlocks = await getAllInputBlocks();
  const inputBlock = inputBlocks.find(
    (block) => block.gid === gid && block.cid === cid
  );

  if (!inputBlock) {
    console.error(`Input block not found for gid=${gid}, cid=${cid}`);
    return notFound();
  }

  // Get the data for this input block type
  try {
    const inputBlockData = await getInputBlockDataByType({ gid, cid });

    // Log diagnostic info for fullScreen input blocks (potential decision trees)
    if (inputBlock.fullScreen) {
      console.log(`Fetched data for fullScreen input block ${gid}/${cid}:`, {
        dataExists: !!inputBlockData,
        dataType: typeof inputBlockData,
        isArray: Array.isArray(inputBlockData),
        length: Array.isArray(inputBlockData) ? inputBlockData.length : 'n/a',
      });
    }

    return (
      <DynamicInputRenderer
        title={inputBlock.name}
        description={inputBlock.description || `Manage ${inputBlock.name} data`}
        inputBlock={inputBlock}
        inputBlockData={inputBlockData || []}
        searchParams={parsedSearchParams}
      />
    );
  } catch (error) {
    console.error(`Error loading data for input block ${gid}/${cid}:`, error);

    // Still render the component but with empty data
    return (
      <DynamicInputRenderer
        title={inputBlock.name}
        description={inputBlock.description || `Manage ${inputBlock.name} data`}
        inputBlock={inputBlock}
        inputBlockData={[]}
        searchParams={parsedSearchParams}
      />
    );
  }
}
