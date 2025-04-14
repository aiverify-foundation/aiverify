'use client';

import { InputBlockGroupData } from '@/app/types';

/**
 * Fetches input block group data for a specific gid and group
 * @param options Filter options (gid and group)
 * @returns Array of InputBlockGroupData that match the filter criteria
 */
export async function getInputBlockGroupDataByGidGroup(
  gid: string,
  group: string
): Promise<InputBlockGroupData> {
  const endpointUrl = `${process.env.APIGW_HOST}/input_block_data/groups/${gid}/${group}`;

  try {
    const res = await fetch(endpointUrl);

    if (!res.ok) {
      const responseText = await res.text();
      console.error(`Failed to fetch input block group data - ${responseText}`);
      throw new Error(
        `Failed to fetch input block group data - ${responseText}`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      'Error fetching input block group data by gid and group:',
      error
    );
    throw error;
  }
}
