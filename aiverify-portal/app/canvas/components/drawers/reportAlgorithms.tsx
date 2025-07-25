import { RiFlaskLine, RiFlaskFill } from '@remixicon/react';
import { Algorithm } from '@/app/types';
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

type ReportAlgorithmsDrawerProps = {
  className?: string;
  algorithms: Algorithm[];
};

function ReportAlgorithmsDrawer(props: ReportAlgorithmsDrawerProps) {
  const { algorithms, className } = props;

  const FlaskIconComponent = (algorithms || []).length > 0 ? RiFlaskFill : RiFlaskLine;

  return (
    <div className={cn('flex w-full justify-center', className)}>
      <Drawer>
        <div className="flex w-full flex-col items-start gap-2">
          <DrawerTrigger asChild>
            <div className="flex w-full flex-col items-center gap-2 rounded-lg bg-gray-300 p-2 px-1 py-3 shadow-lg">
              <button
                className="relative disabled:opacity-50"
                title="View test(s)/algorithm(s) for this report">
                <FlaskIconComponent className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                {(algorithms || []).length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[0.7rem] text-white">
                    {(algorithms || []).length}
                  </span>
                )}
              </button>
            </div>
          </DrawerTrigger>
        </div>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <RiFlaskLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />{' '}
              Tests / Algorithms
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-sm">
              This report runs the following test(s)
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {algorithms && algorithms.length > 0 ? (
              <div className="mt-4 flex flex-col items-start gap-1 text-gray-500">
                <ul>
                  {algorithms.map((algo) => (
                    <li
                      key={`${algo.gid}-${algo.cid}`}
                      className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-gray-400">
                      {/* <div className="mb-2 h-[1px] w-full bg-gray-500" /> */}
                      <h3 className="text-[0.9rem] font-semibold">
                        {algo.name}
                      </h3>
                      <p className="text-[0.8rem]">{algo.description}</p>
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

export { ReportAlgorithmsDrawer };
