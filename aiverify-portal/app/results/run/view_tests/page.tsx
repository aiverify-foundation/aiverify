import Link from 'next/link';
import React from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { getTestRuns } from '@/lib/fetchApis/getTestRunApis';
import ActiveTestsList from './components/ActiveTestsList';

export default async function RunningTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; flow?: string }>;
}) {
  const resolvedParams = await searchParams;
  const projectId = resolvedParams.projectId;
  const flow = resolvedParams.flow;
  const isProjectFlow = !!projectId && !!flow;

  const runs = await getTestRuns();
  console.log('runs', runs);

  return (
    <div className="p-6">
      {/* Header - only shown when not in project flow, since project flow has its own header */}
      {!isProjectFlow && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon
                name={IconName.Lightning}
                size={40}
                color="#FFFFFF"
              />
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-white">Tests</h1>
                <h3 className="text-white">View and monitor all tests</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/results/run">
                <Button
                  pill
                  textColor="white"
                  variant={ButtonVariant.OUTLINE}
                  size="xs"
                  text="RUN NEW TEST"
                />
              </Link>
              <Link href="/results">
                <Button
                  pill
                  textColor="white"
                  variant={ButtonVariant.OUTLINE}
                  size="xs"
                  text="VIEW TEST RESULTS"
                />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Project flow actions - Only shown when in project flow */}
      {isProjectFlow && (
        <div
          className={`flex items-center justify-between ${isProjectFlow ? 'mt-16' : ''} mb-4`}>
          <div /> {/* Empty div for spacing */}
          <div className="flex items-center space-x-2">
            <Link href={`/results/run?projectId=${projectId}&flow=${flow}`}>
              <Button
                pill
                textColor="white"
                variant={ButtonVariant.OUTLINE}
                size="xs"
                text="RUN NEW TEST"
              />
            </Link>
            <Link
              href={`/project/select_data?projectId=${projectId}&flow=${flow}`}>
              <Button
                pill
                textColor="white"
                variant={ButtonVariant.OUTLINE}
                size="xs"
                text="BACK TO PROJECT"
              />
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`${isProjectFlow ? '' : 'mt-4'}`}>
        <ActiveTestsList runs={runs} />
      </div>
    </div>
  );
}
