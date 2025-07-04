import _ from 'lodash';
import Link from 'next/link';
// import { ChecklistsProvider } from '@/app/inputs/context/ChecklistsContext';
// import { ScaleIcon } from '@/app/inputs/utils/icons';
import { InputBlock } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';

// Tell Next.js this page should be dynamically rendered
export const dynamic = 'force-dynamic';

export default async function InputsPage() {
  // Get all available input blocks
  const inputBlocks = await getAllInputBlocks();
  // console.log('inputBlocks', inputBlocks);

  // Group input blocks by their group value
  const inputBlockGroups = inputBlocks.reduce(
    (acc, block) => {
      if (!block.group) {
        return acc;
      }

      // Use group as key, default to "Other" if no group specified
      const groupName = block.group;

      if (!acc[groupName]) {
        acc[groupName] = {
          name: groupName,
          gid: block.gid,
          blocks: [],
        };
      }

      acc[groupName].blocks.push(block);
      return acc;
    },
    {} as Record<string, { name: string; gid: string; blocks: InputBlock[] }>
  );
  const sortedInputBlockGroups = Object.values(inputBlockGroups).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const inputBlockNonGroups = inputBlocks.reduce((acc, block) => {
    if (block.group) {
      return acc;
    }
    acc.push(block);
    return acc;
  }, [] as InputBlock[]);
  console.log('inputBlockNonGroups', inputBlockNonGroups);

  return (
    // <ChecklistsProvider>
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon
            name={IconName.File}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">User Inputs</h1>
            <h3 className="text-white">View and manage user inputs</h3>
          </div>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        {/* Group cards */}
        {Object.values(sortedInputBlockGroups).map((group) => (
          <Link
            key={group.name}
            href={`/inputs/groups/${encodeURIComponent(group.gid)}/${encodeURIComponent(group.name)}`}>
            <Card
              size="md"
              enableTiltEffect={true}
              tiltSpeed={200}
              tiltRotation={5}
              enableTiltGlare={true}
              tiltMaxGlare={0.3}
              className="bg-secondary-500 !bg-none">
              <div className="flex flex-col justify-between p-6">
                <Icon
                  name={IconName.CheckList}
                  size={50}
                  color="white"
                />
                <div>
                  <p className="tracking-wide text-shadow-sm">
                    Manage input blocks in this group
                  </p>
                  <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                    {group.name}
                  </h2>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {/* Non-grouped cards */}
        {inputBlockNonGroups.map((block) => (
          <Link
            key={block.gid + block.cid}
            href={`/inputs/${encodeURIComponent(block.gid)}/${encodeURIComponent(block.cid)}`}>
            <Card
              size="md"
              enableTiltEffect={true}
              tiltSpeed={200}
              tiltRotation={5}
              enableTiltGlare={true}
              tiltMaxGlare={0.3}
              className="bg-secondary-500 !bg-none">
              <div className="flex flex-col justify-between p-6">
                <Icon
                  name={IconName.CheckList}
                  size={50}
                  color="white"
                />
                <div>
                  <p className="tracking-wide text-shadow-sm">
                    Manage input blocks in this group
                  </p>
                  <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                    {block.name}
                  </h2>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
    // </ChecklistsProvider>
  );
}
