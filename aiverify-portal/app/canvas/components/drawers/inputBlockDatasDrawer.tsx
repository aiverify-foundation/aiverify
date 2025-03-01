import { RiDatabase2Fill } from '@remixicon/react';
import { useState } from 'react';
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

  function handleCheckboxClick(inputBlockData: InputBlockData) {
    return () => {
      const updatedSelectedInputBlockDatas = selectedInputBlockDatas.includes(
        inputBlockData
      )
        ? selectedInputBlockDatas.filter((r) => r !== inputBlockData)
        : [...selectedInputBlockDatas, inputBlockData];
      setSelectedInputBlockDatas(updatedSelectedInputBlockDatas);
      onCheckboxClick(updatedSelectedInputBlockDatas);
    };
  }

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
                  selectedInputBlockDatas.length > 0
                    ? 'text-blue-500'
                    : 'text-gray-500'
                )}>
                {selectedInputBlockDatas.length > 0
                  ? selectedInputBlockDatas.length
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
            <div className="space-y-4">
              {allInputBlockDatasOnSystem.map((inputBlockData, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    checked={selectedInputBlockDatas.includes(inputBlockData)}
                    disabled={
                      !selectedInputBlockDatas.includes(inputBlockData) &&
                      selectedInputBlockDatas.some(
                        (r) => r.gid === inputBlockData.gid
                      )
                    }
                    onChange={handleCheckboxClick(inputBlockData)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {inputBlockData.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Group: {inputBlockData.group} •{' '}
                      {new Date(inputBlockData.created_at).toLocaleString()}
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

export { InputBlockDatasDrawer };
