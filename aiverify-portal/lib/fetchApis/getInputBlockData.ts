import { InputBlockData } from '@/app/types';
import { getInputBlockDatas } from './getInputBlockDatas';

interface FilterOptions {
  gid: string;
  cid: string;
}

/**
 * Fetches input block data for a specific input block type
 * @param options Filter options (gid and cid)
 * @returns Array of InputBlockData that match the filter criteria
 */
export async function getInputBlockDataByType(
  options: FilterOptions
): Promise<InputBlockData[]> {
  try {
    const data = await getInputBlockDatas();
    return data.filter(
      (item) => item.gid === options.gid && item.cid === options.cid
    );
  } catch (error) {
    console.error('Error fetching input block data by type:', error);
    return [];
  }
} 