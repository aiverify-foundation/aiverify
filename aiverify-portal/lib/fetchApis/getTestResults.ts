import { TestResult } from '@/app/types';

const endpointUrl = `${process.env.APIGW_HOST}/test_results/`;

type Options = {
  id?: number;
};

export async function getTestResults(opts?: Options): Promise<TestResult[]> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  }
  const res = await fetch(requestUrl); //{ cache: 'force-cache' }

  if (!res.ok) {
    const responseText = await res.text();
    console.log(`Failed to fetch test results - ${responseText}`);
    throw new Error(`Failed to fetch test results - ${responseText}`);
  }

  return res.json();
}
