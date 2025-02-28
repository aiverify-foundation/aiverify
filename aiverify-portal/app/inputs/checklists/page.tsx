import { Icon, IconName } from '@/lib/components/IconSVG';
import { getAllChecklists } from '@/lib/fetchApis/getAllChecklists';
import ActionButtons from './components/ActionButtons';
import Link from 'next/link';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import GroupList from './components/GroupList';

export default async function ChecklistsPage() {
  const checklists = await getAllChecklists();

  return (
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
            <div className="flex">
              <Link href="/inputs/">
                <h1 className="text-2xl font-bold text-white hover:underline">
                  User Inputs
                </h1>
              </Link>
              <ChevronLeftIcon
                size={28}
                color="#FFFFFF"
              />
              <h1 className="text-2xl font-bold text-white">
                AI Verify Process Checklists
              </h1>
            </div>
            <h3 className="text-white">
              Manage and view AI Verify Process Checklists
            </h3>
          </div>
        </div>
        <ActionButtons />
      </div>
      <GroupList checklists={checklists} />
    </div>
  );
}
