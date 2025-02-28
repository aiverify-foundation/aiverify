import { InputBlockData } from '@/app/types';

const endpointUrl = `${process.env.APIGW_HOST}/input_block_data`;

type Options = {
  id?: number;
};

export async function getInputBlockDatas(
  opts?: Options
): Promise<InputBlockData[]> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  } else {
    requestUrl = `${endpointUrl}`;
  }
  const res = await fetch(requestUrl, { cache: 'force-cache' }); //TODO - use invalidate caching or totally remove caching

  if (!res.ok) {
    const responseText = await res.text();
    console.log(`Failed to fetch test results - ${responseText}`);
    throw new Error(`Failed to fetch test results - ${responseText}`);
  }

  return res.json();
}
