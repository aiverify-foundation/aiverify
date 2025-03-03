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

  // Group input block datas by their type and group
  const groupedInputBlockDatas = useMemo(() => {
    const groups: { [key: string]: InputBlockData[] } = {};
    const fairnessTrees: { [key: string]: InputBlockData[] } = {};

    allInputBlockDatasOnSystem.forEach((inputBlockData) => {
      // Check if it's a fairness tree
      if (inputBlockData.gid === "aiverify.stock.fairness_metrics_toolbox_for_classification" && 
          inputBlockData.cid === "fairness_tree") {
        // Group fairness trees by their name/group
        const key = inputBlockData.name;
        if (!fairnessTrees[key]) {
          fairnessTrees[key] = [];
        }
        fairnessTrees[key].push(inputBlockData);
      }
      // Check if it's a process checklist
      else if (inputBlockData.gid === "aiverify.stock.process_checklist") {
        // Group process checklists by their group
        const key = inputBlockData.group;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(inputBlockData);
      }
    });

    return { groups, fairnessTrees };
  }, [allInputBlockDatasOnSystem]);

  function handleCheckboxClick(inputBlockData: InputBlockData) {
    return () => {
      // Check if it's a fairness tree
      if (inputBlockData.gid === "aiverify.stock.fairness_metrics_toolbox_for_classification" && 
          inputBlockData.cid === "fairness_tree") {
        // For fairness trees, select/deselect by name
        const treeKey = inputBlockData.name;
        const treeItems = groupedInputBlockDatas.fairnessTrees[treeKey] || [];
        
        const isTreeSelected = treeItems.some(item => 
          selectedInputBlockDatas.includes(item)
        );

        const updatedSelectedInputBlockDatas = isTreeSelected
          ? selectedInputBlockDatas.filter(item => !treeItems.includes(item))
          : [...selectedInputBlockDatas.filter(item => 
              !(item.gid === "aiverify.stock.fairness_metrics_toolbox_for_classification" && 
                item.cid === "fairness_tree")
            ), inputBlockData];

        setSelectedInputBlockDatas(updatedSelectedInputBlockDatas);
        onCheckboxClick(updatedSelectedInputBlockDatas);
      }
      // Check if it's a process checklist
      else if (inputBlockData.gid === "aiverify.stock.process_checklist") {
        // For process checklists, select/deselect the entire group
        const groupKey = inputBlockData.group;
        const groupItems = groupedInputBlockDatas.groups[groupKey] || [];
        
        const isGroupSelected = groupItems.every(item => 
          selectedInputBlockDatas.includes(item)
        );

        const updatedSelectedInputBlockDatas = isGroupSelected
          ? selectedInputBlockDatas.filter(item => !groupItems.includes(item))
          : [...selectedInputBlockDatas.filter(item => 
              !(item.gid === "aiverify.stock.process_checklist" && 
                item.group === inputBlockData.group)
            ), ...groupItems];

        setSelectedInputBlockDatas(updatedSelectedInputBlockDatas);
        onCheckboxClick(updatedSelectedInputBlockDatas);
      }
    };
  }

  // Add this function to count selected groups
  const getSelectedGroupCount = useMemo(() => {
    let count = 0;
    
    // Check if any fairness tree is selected
    if (selectedInputBlockDatas.some(item => 
      item.gid === "aiverify.stock.fairness_metrics_toolbox_for_classification" && 
      item.cid === "fairness_tree"
    )) {
      count++;
    }

    // Check if any process checklist group is selected
    if (selectedInputBlockDatas.some(item => 
      item.gid === "aiverify.stock.process_checklist"
    )) {
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
                  getSelectedGroupCount > 0
                    ? 'text-blue-500'
                    : 'text-gray-500'
                )}>
                {getSelectedGroupCount > 0
                  ? getSelectedGroupCount
                  : 'none'}{' '}
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
              {/* Fairness Trees Section */}
              {Object.entries(groupedInputBlockDatas.fairnessTrees).length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-sm font-medium text-gray-900">Fairness Trees</h3>
                  <div className="space-y-3">
                    {Object.entries(groupedInputBlockDatas.fairnessTrees).map(([treeKey, treeItems], index) => {
                      const firstItem = treeItems[0];
                      const isTreeSelected = treeItems.some(item => 
                        selectedInputBlockDatas.includes(item)
                      );
                      const isTreeDisabled = !isTreeSelected && 
                        selectedInputBlockDatas.some(item => 
                          item.gid === "aiverify.stock.fairness_metrics_toolbox_for_classification" && 
                          item.cid === "fairness_tree"
                        );

                      return (
                        <label
                          key={index}
                          className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            checked={isTreeSelected}
                            disabled={isTreeDisabled}
                            onChange={handleCheckboxClick(firstItem)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {firstItem.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(firstItem.created_at).toLocaleString()}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Process Checklists Section */}
              {Object.entries(groupedInputBlockDatas.groups).length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-sm font-medium text-gray-900">Process Checklists</h3>
                  <div className="space-y-3">
                    {Object.entries(groupedInputBlockDatas.groups).map(([groupKey, groupItems], index) => {
                      const firstItem = groupItems[0];
                      const isGroupSelected = groupItems.every(item => 
                        selectedInputBlockDatas.includes(item)
                      );
                      const isGroupDisabled = !isGroupSelected && 
                        selectedInputBlockDatas.some(item => 
                          item.gid === "aiverify.stock.process_checklist"
                        );

                      return (
                        <label
                          key={index}
                          className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            checked={isGroupSelected}
                            disabled={isGroupDisabled}
                            onChange={handleCheckboxClick(firstItem)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {firstItem.group}
                            </span>
                            <span className="text-xs text-gray-500">
                              {groupItems.length} checklists • {new Date(firstItem.created_at).toLocaleString()}
                            </span>
                          </div>
                        </label>
                      );
                    })}
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
