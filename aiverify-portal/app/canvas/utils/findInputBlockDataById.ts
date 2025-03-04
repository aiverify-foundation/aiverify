import { InputBlockData } from '@/app/types';

/**
 * Finds an input block data by its ID from a list of input block datas
 * @param inputBlockDatas - Array of input block datas to search through
 * @param inputBlockDataId - The ID of the input block data to find
 * @returns The found input block data or undefined if not found
 */
export function findInputBlockDataById(
  inputBlockDatas: InputBlockData[],
  inputBlockDataId: number
): InputBlockData | undefined {
  return inputBlockDatas.find(
    (inputBlockData) => inputBlockData.id === inputBlockDataId
  );
}
