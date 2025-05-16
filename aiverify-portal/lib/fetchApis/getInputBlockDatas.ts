import { InputBlockData, InputBlockGroupData } from '@/app/types';

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
  const res = await fetch(requestUrl);

  if (!res.ok) {
    const responseText = await res.text();
    console.log(`Failed to fetch test results - ${responseText}`);
    throw new Error(`Failed to fetch test results - ${responseText}`);
  }

  return res.json();
}

const endpointUrl2 = `${process.env.APIGW_HOST}/input_block_data/groups/`;

export async function getInputBlockGroupDatas(
  opts?: Options
): Promise<InputBlockGroupData[]> {
  let requestUrl = endpointUrl2;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl2}/${opts.id}`;
  } else {
    requestUrl = `${endpointUrl2}`;
  }
  const res = await fetch(requestUrl);

  if (!res.ok) {
    const responseText = await res.text();
    console.log(`Failed to fetch input block group data - ${responseText}`);
    throw new Error(`Failed to fetch input block group data - ${responseText}`);
  }

  return res.json();
}
