'use client';
import { RiDatabase2Fill } from '@remixicon/react';
import { useState, useMemo } from 'react';
import { InputBlockData } from '@/app/types';
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

type InputBlockDatasDrawerProps = {
  className?: string;
  allInputBlockDatasOnSystem: InputBlockData[];
  selectedInputBlockDatasFromUrlParams: InputBlockData[];
  onCheckboxClick: (selectedInputBlockDatas: InputBlockData[]) => void;
};

function InputBlockDatasDrawer(props: InputBlockDatasDrawerProps) {
  const {
    allInputBlockDatasOnSystem,
    selectedInputBlockDatasFromUrlParams,
    className,
    onCheckboxClick,
  } = props;
  const [selectedInputBlockDatas, setSelectedInputBlockDatas] = useState<
    InputBlockData[]
  >(selectedInputBlockDatasFromUrlParams);

  // Group input block datas dynamically based on their properties
  const groupedInputBlockDatas = useMemo(() => {
    // Group-based input blocks (have a 'group' property)
    const groupedBlocks = allInputBlockDatasOnSystem.reduce((acc, inputBlockData) => {
      if (inputBlockData.group) {
        const groupKey = inputBlockData.group;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(inputBlockData);
      }
      return acc;
    }, {} as Record<string, InputBlockData[]>);

    // Non-grouped input blocks (don't have a 'group' property)
    const nonGroupedBlocks = allInputBlockDatasOnSystem.reduce((acc, inputBlockData) => {
      if (!inputBlockData.group) {
        const nameKey = inputBlockData.name;
        if (!acc[nameKey]) {
          acc[nameKey] = [];
        }
        acc[nameKey].push(inputBlockData);
      }
      return acc;
    }, {} as Record<string, InputBlockData[]>);

    return { groupedBlocks, nonGroupedBlocks };
  }, [allInputBlockDatasOnSystem]);

  function handleCheckboxClick(inputBlockData: InputBlockData, isGrouped: boolean) {
    return () => {
      if (isGrouped) {
        // For grouped blocks, select/deselect the entire group
        const groupKey = inputBlockData.group!;
        const groupItems = groupedInputBlockDatas.groupedBlocks[groupKey] || [];

        const isGroupSelected = groupItems.every((item) =>
          selectedInputBlockDatas.includes(item)
        );

        const updatedSelectedInputBlockDatas = isGroupSelected
          ? selectedInputBlockDatas.filter((item) => !groupItems.includes(item))
          : [
              ...selectedInputBlockDatas.filter(
                (item) => !(item.group && item.group === groupKey)
              ),
              ...groupItems,
            ];

        setSelectedInputBlockDatas(updatedSelectedInputBlockDatas);
        onCheckboxClick(updatedSelectedInputBlockDatas);
      } else {
        // For non-grouped blocks, only one of the same name can be selected
        const nameKey = inputBlockData.name;
        const nameItems = groupedInputBlockDatas.nonGroupedBlocks[nameKey] || [];

        const isNameSelected = nameItems.some((item) =>
          selectedInputBlockDatas.includes(item)
        );

        const updatedSelectedInputBlockDatas = isNameSelected
          ? selectedInputBlockDatas.filter((item) => !nameItems.includes(item))
          : [
              ...selectedInputBlockDatas.filter(
                (item) => !(!item.group && item.name === nameKey)
              ),
              inputBlockData,
            ];

        setSelectedInputBlockDatas(updatedSelectedInputBlockDatas);
        onCheckboxClick(updatedSelectedInputBlockDatas);
      }
    };
  }

  // Count selected groups/items across all types
  const getSelectedGroupCount = useMemo(() => {
    let count = 0;

    // Check for selected grouped blocks
    const hasSelectedGroupedBlocks = selectedInputBlockDatas.some(
      (item) => item.group
    );
    if (hasSelectedGroupedBlocks) {
      count++;
    }

    // Check for selected non-grouped blocks
    const hasSelectedNonGroupedBlocks = selectedInputBlockDatas.some(
      (item) => !item.group
    );
    if (hasSelectedNonGroupedBlocks) {
      count++;
    }

    return count;
  }, [selectedInputBlockDatas]);

  return (
    <div className={cn('flex justify-center', className)}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="white">
            <div className="flex min-w-[150px] flex-col items-start">
              <div className="flex items-center gap-1">
                <RiDatabase2Fill className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                &nbsp;Input block data
              </div>
              <div
                className={cn(
                  'w-full text-xs',
                  getSelectedGroupCount > 0 ? 'text-blue-500' : 'text-gray-500'
                )}>
                {getSelectedGroupCount > 0 ? getSelectedGroupCount : 'none'}{' '}
                selected
              </div>
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Populate widgets with input block data</DrawerTitle>
            <DrawerDescription className="mt-1 text-sm">
              Select the input block data you want to use to populate the
              widgets.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-8">
              {/* Non-grouped blocks section */}
              {Object.entries(groupedInputBlockDatas.nonGroupedBlocks).length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-sm font-medium text-gray-900">
                    Individual Input Blocks
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(groupedInputBlockDatas.nonGroupedBlocks).map(
                      ([nameKey, nameItems], index) => {
                        const firstItem = nameItems[0];
                        const isNameSelected = nameItems.some((item) =>
                          selectedInputBlockDatas.includes(item)
                        );
                        const isNameDisabled =
                          !isNameSelected &&
                          selectedInputBlockDatas.some((item) => !item.group);

                        return (
                          <label
                            key={index}
                            className="flex items-center gap-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              checked={isNameSelected}
                              disabled={isNameDisabled}
                              onChange={handleCheckboxClick(firstItem, false)}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {firstItem.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  firstItem.created_at + "Z"
                                ).toLocaleString()}
                              </span>
                            </div>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Grouped blocks section */}
              {Object.entries(groupedInputBlockDatas.groupedBlocks).length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-sm font-medium text-gray-900">
                    Grouped Input Blocks
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(groupedInputBlockDatas.groupedBlocks).map(
                      ([groupKey, groupItems], index) => {
                        const firstItem = groupItems[0];
                        const isGroupSelected = groupItems.every((item) =>
                          selectedInputBlockDatas.includes(item)
                        );
                        const isGroupDisabled =
                          !isGroupSelected &&
                          selectedInputBlockDatas.some((item) => item.group);

                        return (
                          <label
                            key={index}
                            className="flex items-center gap-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              checked={isGroupSelected}
                              disabled={isGroupDisabled}
                              onChange={handleCheckboxClick(firstItem, true)}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {groupKey}
                              </span>
                              <span className="text-xs text-gray-500">
                                {groupItems.length} items •{' '}
                                {new Date(
                                  firstItem.created_at + "Z"
                                ).toLocaleString()}
                              </span>
                            </div>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
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

export { InputBlockDatasDrawer };
