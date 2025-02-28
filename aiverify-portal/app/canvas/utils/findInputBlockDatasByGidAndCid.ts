import { InputBlockData } from '@/app/types';

export function findInputBlockDatasByGidAndCid(
  inputBlockDatas: InputBlockData[],
  gid: string,
  cid: string
) {
  return inputBlockDatas.filter(
    (inputBlockData) => inputBlockData.gid === gid && inputBlockData.cid === cid
  );
}
