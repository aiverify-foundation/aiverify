'use client';
import { RiArticleFill } from '@remixicon/react';
import { useState } from 'react';
import { ParsedTestResults } from '@/app/canvas/types';
import { Button } from '@/lib/components/TremurButton';
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerBody,
} from '@/lib/components/drawer';
import { Drawer } from '@/lib/components/drawer';
import { cn } from '@/lib/utils/twmerge';

type TestResultsDrawerProps = {
  className?: string;
  allTestResultsOnSystem: ParsedTestResults[];
  selectedTestResultsFromUrlParams: ParsedTestResults[];
  onCheckboxClick: (selectedTestResults: ParsedTestResults[]) => void;
};

function TestResultsDrawer(props: TestResultsDrawerProps) {
  const {
    allTestResultsOnSystem,
    selectedTestResultsFromUrlParams,
    className,
    onCheckboxClick,
  } = props;
  const [selectedTestResults, setSelectedTestResults] = useState<
    ParsedTestResults[]
  >(selectedTestResultsFromUrlParams);

  function handleCheckboxClick(result: ParsedTestResults) {
    return () => {
      const updatedSelectedTestResults = selectedTestResults.includes(result)
        ? selectedTestResults.filter((r) => r !== result)
        : [...selectedTestResults, result];
      setSelectedTestResults(updatedSelectedTestResults);
      onCheckboxClick(updatedSelectedTestResults);
    };
  }

  return (
    <div className={cn('flex justify-center', className)}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="white">
            <div className="flex min-w-[150px] flex-col items-start">
              <div className="flex items-center gap-1">
                <RiArticleFill className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                &nbsp;Test results
              </div>
              <div
                className={cn(
                  'w-full text-xs',
                  selectedTestResults.length > 0
                    ? 'text-blue-500'
                    : 'text-gray-500'
                )}>
                {selectedTestResults.length > 0
                  ? selectedTestResults.length
                  : 'none'}{' '}
                selected
              </div>
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Populate widgets with test results</DrawerTitle>
            <DrawerDescription className="mt-1 text-sm">
              Select the test results you want to use to populate the widgets.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-4">
              {allTestResultsOnSystem.map((result, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    checked={selectedTestResults.includes(result)}
                    disabled={
                      !selectedTestResults.includes(result) &&
                      selectedTestResults.some((r) => r.gid === result.gid)
                    }
                    onChange={handleCheckboxClick(result)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {result.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.created_at + "Z").toLocaleString()}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter className="mt-6">
            <DrawerClose asChild>
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary">
                OK
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { TestResultsDrawer };
