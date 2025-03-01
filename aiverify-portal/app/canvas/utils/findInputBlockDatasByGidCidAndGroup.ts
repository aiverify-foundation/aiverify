import { InputBlockData } from '@/app/types';

/**
 * Finds input block data that matches the given gid, cid and group name
 * Used to map input block data to widgets based on their gid and cid identifiers
 *
 * @param inputBlockDatas - Array of input block data objects to search through
 * @param gid - Global identifier to match
 * @param cid - Component identifier to match
 * @param groupName - Group name to match
 * @returns The matching input block data object, or undefined if no match found
 */

export function findInputBlockDatasByGidCidAndGroup(
  inputBlockDatas: InputBlockData[],
  gid: string,
  cid: string,
  groupName: string
): InputBlockData | undefined {
  return inputBlockDatas.find(
    (inputBlockData) =>
      inputBlockData.gid === gid &&
      inputBlockData.cid === cid &&
      inputBlockData.group === groupName
  );
}
