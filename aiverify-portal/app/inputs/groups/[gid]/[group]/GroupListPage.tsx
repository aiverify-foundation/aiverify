'use client';

import Link from 'next/link';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from './components/ActionButtons';
import GroupList from './components/GroupList';

export default function GroupListPage() {
  const { gid, group } = useInputBlockGroupData();

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
              <h1 className="text-2xl font-bold text-white">{group}</h1>
            </div>
            <h3 className="text-white">Manage and view {group}</h3>
          </div>
        </div>
        <ActionButtons
          group={group}
          gid={gid}
        />
      </div>
      <GroupList />
    </div>
  );
}
