import Link from 'next/link';
import { ChecklistsProvider } from '@/app/inputs/context/ChecklistsContext';
import { ScaleIcon } from '@/app/inputs/utils/icons';
import { InputBlock } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';

export default async function InputsPage() {
  // Get all available input blocks
  const inputBlocks = await getAllInputBlocks();
  console.log('inputBlocks', inputBlocks);

  // Create a map of unique input block types, excluding aiverify process checklist and fairness tree
  const uniqueInputBlocks = inputBlocks.reduce(
    (acc, block) => {
      // Skip hardcoded blocks
      if (
        block.gid === 'aiverify.stock.process_checklist' ||
        block.gid ===
          'aiverify.stock.fairness_metrics_toolbox_for_classification'
      ) {
        return acc;
      }

      // Use gid as key to ensure uniqueness
      if (!acc[block.cid]) {
        acc[block.cid] = block;
      }
      return acc;
    },
    {} as Record<string, InputBlock>
  );
  console.log('uniqueInputBlocks', uniqueInputBlocks);

  return (
    <ChecklistsProvider>
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
          {/* Hardcoded cards */}
          <Link href="/inputs/checklists">
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
                    Manage process checklists
                  </p>
                  <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                    AI Verify Process Checklists
                  </h2>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/inputs/fairnesstree">
            <Card
              size="md"
              enableTiltEffect={true}
              tiltSpeed={200}
              tiltRotation={5}
              enableTiltGlare={true}
              tiltMaxGlare={0.3}
              className="bg-secondary-500 !bg-none">
              <div className="flex flex-col justify-between p-6">
                <ScaleIcon color="white" />
                <div>
                  <p className="tracking-wide text-shadow-sm">
                    Manage and view fairness trees
                  </p>
                  <h2 className="text-2xl font-bold tracking-wide text-shadow-sm">
                    Fairness Tree
                  </h2>
                </div>
              </div>
            </Card>
          </Link>
          {/* Dynamic cards for other input block types */}
          {Object.values(uniqueInputBlocks).map((block) => (
            <Link
              key={block.cid}
              href={`/inputs/${block.gid}/${block.cid}`}>
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
                    name={IconName.File}
                    size={50}
                    color="white"
                  />
                  <div>
                    <p className="tracking-wide text-shadow-sm">
                      {block.description || 'Manage input data'}
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
    </ChecklistsProvider>
  );
}
