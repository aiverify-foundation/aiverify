import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';

interface PageParams {
  group: string;
}

export default async function GroupPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // Await the params promise to get the values
  const resolvedParams = await params;

  // Decode the group name from the URL
  const groupName = decodeURIComponent(resolvedParams.group);

  // Get all available input blocks
  const inputBlocks = await getAllInputBlocks();

  // Filter input blocks by the specified group
  const groupInputBlocks = inputBlocks.filter((block) => {
    // Skip hardcoded blocks
    if (
      block.gid === 'aiverify.stock.process_checklist' ||
      block.gid === 'aiverify.stock.fairness_metrics_toolbox_for_classification'
    ) {
      return false;
    }

    // Match blocks with the specified group (or "Other" if no group specified)
    return (block.group || 'Other') === groupName;
  });

  // If no input blocks found for this group, return 404
  if (groupInputBlocks.length === 0) {
    return notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        {/* Back button and title */}
        <div className="flex items-center">
          <Link href="/inputs">
            <Icon
              name={IconName.ArrowLeft}
              size={40}
              color="#FFFFFF"
            />
          </Link>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">{groupName}</h1>
            <h3 className="text-white">Select an input block type</h3>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        {/* Cards for input blocks in this group */}
        {groupInputBlocks.map((block) => (
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
  );
}
