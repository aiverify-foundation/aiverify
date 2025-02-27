import { MockData } from '@/app/types';

export function findMockDataByTypeAndCid(
  mockData: MockData[],
  type: string,
  cid: string
) {
  return mockData.find((mock) => mock.type === type && mock.cid === cid);
}
