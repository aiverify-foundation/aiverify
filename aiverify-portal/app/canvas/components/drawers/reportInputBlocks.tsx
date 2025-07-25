import { RiFileTextLine, RiFileTextFill } from '@remixicon/react';
import { InputBlock } from '@/app/types';
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

type ReportInputBlocksDrawerProps = {
  className?: string;
  inputBlocks: InputBlock[];
};

function ReportInputBlocksDrawer(props: ReportInputBlocksDrawerProps) {
  const { inputBlocks, className } = props;

  const FileIconComponent =
    (inputBlocks || []).length > 0 ? RiFileTextFill : RiFileTextLine;

  return (
    <div className={cn('flex w-full justify-center', className)}>
      <Drawer>
        <div className="flex w-full flex-col items-start gap-2">
          <DrawerTrigger asChild>
            <div className="flex w-full flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
              <button
                className="relative disabled:opacity-50"
                title="View input block(s) for this report">
                <FileIconComponent className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                {(inputBlocks || []).length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[0.7rem] text-white">
                    {(inputBlocks || []).length}
                  </span>
                )}
              </button>
            </div>
          </DrawerTrigger>
        </div>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <RiFileTextLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />{' '}
              Input Blocks
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-sm">
              This report contains the following input block(s)
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {inputBlocks && inputBlocks.length > 0 ? (
              <div className="mt-4 flex flex-col items-start gap-1 text-gray-500">
                <ul>
                  {inputBlocks.map((block) => (
                    <li
                      key={`${block.gid}-${block.cid}`}
                      className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-gray-400">
                      <h3 className="text-[0.9rem] font-semibold">
                        {block.name}
                      </h3>
                      <p className="text-[0.8rem]">{block.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </DrawerBody>
          <DrawerFooter className="mt-6">
            <DrawerClose asChild>
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary">
                Go back
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { ReportInputBlocksDrawer };
