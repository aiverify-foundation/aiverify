import {
  RiFlaskFill,
  RiFlaskLine,
  RiSurveyFill,
  RiSurveyLine,
} from '@remixicon/react';
import React from 'react';
import { Layout } from 'react-grid-layout';
import { ParsedTestResults, WidgetOnGridLayout } from '@/app/canvas/types';
import { findAlgoFromPluginsById } from '@/app/canvas/utils/findAlgoFromPluginsById';
import { findInputBlockFromPluginsById } from '@/app/canvas/utils/findInputBlockFromPluginsById';
import { findPluginByGid } from '@/app/canvas/utils/findPluginByGid';
import { InputBlockData, Plugin } from '@/app/types';
import { Button } from '@/lib/components/Button/button';
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/lib/components/drawer';
import { Drawer } from '@/lib/components/drawer';
import { cn } from '@/lib/utils/twmerge';

type WidgetPropertiesDrawerProps = {
  className?: string;
  open: boolean;
  layout: Layout;
  allAvailablePlugins: Plugin[];
  // All available test results in the system is available here for future use if required (currently not used)
  allAvailableTestResults: ParsedTestResults[];
  testResultsUsed?: ParsedTestResults;
  inputBlocksDataUsed?: InputBlockData[];
  widget: WidgetOnGridLayout;
  onOkClick: () => void;
  onDeleteClick: () => void;
  setOpen: (open: boolean) => void;
};

function Divider({ className }: { className?: string }) {
  return <div className={cn('my-2 h-[1px] w-full bg-gray-200', className)} />;
}

function WidgetPropertiesDrawer(props: WidgetPropertiesDrawerProps) {
  const {
    open,
    layout,
    allAvailablePlugins,
    widget,
    testResultsUsed,
    inputBlocksDataUsed,
    className,
    onOkClick,
    onDeleteClick,
    setOpen,
  } = props;
  console.log(allAvailablePlugins);
  const parentPlugin = findPluginByGid(allAvailablePlugins, widget.gid);
  const algos = widget.dependencies
    .map((dep) => {
      if (!dep.cid) {
        return undefined;
      }
      const gid = dep.gid || widget.gid;
      return findAlgoFromPluginsById(allAvailablePlugins, gid, dep.cid);
    })
    .filter((algo) => algo !== undefined);

  const inputBlocks = widget.dependencies
    .map((ib) => {
      if (!ib.cid) {
        return undefined;
      }
      const gid = ib.gid || widget.gid;
      return findInputBlockFromPluginsById(allAvailablePlugins, gid, ib.cid);
    })
    .filter((ib) => ib !== undefined);
  console.log(widget);
  return (
    <div
      className={cn('flex justify-center', className)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}>
      <Drawer
        open={open}
        onOpenChange={setOpen}>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-gray-500">
              Widget Properties
            </DrawerTitle>
            <DrawerDescription className="mt-1 py-2 text-sm">
              <span className="text-[1.1rem] font-semibold text-primary-800">
                {parentPlugin?.name}
              </span>
              <br />
              <span className="text-[0.9rem] font-semibold text-primary-900">
                {widget.name}
              </span>
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <section className="items-between flex w-full gap-2 text-[0.8rem] text-gray-500">
              <div>
                Grid Position: {layout.x}, {layout.y}
              </div>
              <div>
                Dimensions: {layout.w}x{layout.h}
              </div>
              <div>
                Max. Dimensions: {layout.maxW}x{layout.maxH}
              </div>
              <div>
                Min. Dimensions: {layout.minW}x{layout.minH}
              </div>
            </section>
            <Divider className="my-8 mt-4" />
            {algos && algos.length > 0 ? (
              <React.Fragment>
                <div className="mt-4 flex flex-col items-start gap-1 text-gray-500">
                  <div className="flex items-center gap-2">
                    <RiFlaskLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                    <h2 className="text-[0.9rem] font-semibold">
                      Widget runs the following test(s)
                    </h2>
                  </div>
                  <ul>
                    {algos.map((algo) => (
                      <li
                        key={algo.cid}
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
                <div className="ml-5 flex flex-col items-start gap-1">
                  <div className="mt-8 flex items-center gap-2 text-gray-500">
                    <RiFlaskFill className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                    <h2 className="text-[0.8rem] font-semibold">
                      Test(s) results
                    </h2>
                  </div>
                  {!testResultsUsed ? (
                    <div className="mb-1 text-[0.8rem] text-blue-600">
                      Currently using mock data
                    </div>
                  ) : (
                    <div className="flex flex-col items-start">
                      <div className="text-[0.8rem] text-blue-600">
                        {testResultsUsed.name}
                      </div>
                      <div className="text-[0.8rem] text-blue-600">
                        Created at:{' '}
                        {new Date(testResultsUsed.created_at).toLocaleString()}
                      </div>
                      <div className="text-[0.8rem] text-blue-600">
                        Updated at:{' '}
                        {new Date(testResultsUsed.updated_at).toLocaleString()}
                      </div>
                      <div className="text-[0.8rem] text-blue-600">
                        Version: {testResultsUsed.version}
                      </div>
                    </div>
                  )}
                </div>
                <Divider />
              </React.Fragment>
            ) : null}

            {inputBlocks && inputBlocks.length > 0 ? (
              <React.Fragment>
                <div className="mt-8 flex flex-col items-start gap-1 text-gray-500">
                  <div className="flex items-center gap-2">
                    <RiSurveyLine className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                    <h2 className="text-[0.9rem] font-semibold">
                      Widget requires the following user input(s)
                    </h2>
                  </div>
                  <ul>
                    {inputBlocks.map((ib) => (
                      <li
                        key={ib.cid}
                        className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-gray-400">
                        {/* <div className="mb-2 h-[1px] w-full bg-gray-500" /> */}
                        <h3 className="text-[0.9rem] font-semibold">
                          {ib.name}
                        </h3>
                        <p className="text-[0.8rem]">{ib.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ml-5 flex flex-col items-start gap-1">
                  <div className="mt-8 flex items-center gap-2 text-gray-500">
                    <RiSurveyFill className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                    <h2 className="text-[0.8rem] font-semibold">
                      User Input Data
                    </h2>
                  </div>
                  {!inputBlocksDataUsed ? (
                    <div className="mb-1 text-[0.8rem] text-blue-600">
                      Currently using mock data
                    </div>
                  ) : null}
                </div>
              </React.Fragment>
            ) : null}
          </DrawerBody>
          <DrawerFooter className="mt-6">
            <DrawerClose asChild>
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary"
                onClick={() => onDeleteClick()}>
                Delete widget
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button
                className="w-full sm:w-fit"
                onClick={() => onOkClick()}>
                Ok
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { WidgetPropertiesDrawer };
