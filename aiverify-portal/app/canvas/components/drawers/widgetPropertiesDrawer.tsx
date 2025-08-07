'use client';
import {
  RiFlaskFill,
  RiFlaskLine,
  RiSurveyFill,
  RiSurveyLine,
  RiSettings4Line,
} from '@remixicon/react';
import { debounce } from 'lodash';
import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { WidgetAction } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { ParsedTestResults, WidgetOnGridLayout } from '@/app/canvas/types';
import { findAlgoFromPluginsById } from '@/app/canvas/utils/findAlgoFromPluginsById';
import { findInputBlockFromPluginsById } from '@/app/canvas/utils/findInputBlockFromPluginsById';
import { findPluginByGid } from '@/app/canvas/utils/findPluginByGid';
import { findTestResultByAlgoGidAndCid } from '@/app/canvas/utils/findTestResultByAlgoGidAndCid';
import { InputBlockData, Plugin, WidgetProperty } from '@/app/types';
import { Button } from '@/lib/components/TremurButton';
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
  testResultsUsed?: ParsedTestResults[];
  inputBlocksDataUsed?: InputBlockData[];
  widget: WidgetOnGridLayout;
  onOkClick: () => void;
  onDeleteClick: () => void;
  setOpen: (open: boolean) => void;
  dispatch: React.Dispatch<WidgetAction>;
  pageIndex: number;
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
    dispatch,
    pageIndex,
  } = props;

  // State to track property values
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>(
    {}
  );

  // Initialize property values from widget properties
  useEffect(() => {
    if (widget.properties && widget.properties.length > 0) {
      const initialValues: Record<string, string> = {};
      widget.properties.forEach((prop) => {
        initialValues[prop.key] =
          prop.value !== undefined ? prop.value : prop.default;
      });
      setPropertyValues(initialValues);
    }
  }, [widget.properties]);

  // Create a debounced function to update the widget in the reducer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateWidget = useCallback(
    debounce((key: string, value: string) => {
      if (widget.properties) {
        const updatedProperties = widget.properties.map((prop) =>
          prop.key === key ? { ...prop, value } : prop
        );

        const updatedWidget = {
          ...widget,
          properties: updatedProperties,
        };

        dispatch({
          type: 'UPDATE_WIDGET',
          widget: updatedWidget,
          pageIndex,
        });
      }
    }, 300),
    [widget, dispatch, pageIndex]
  );

  // Handle property value change
  const handlePropertyChange = (key: string, value: string) => {
    // Update local state immediately for responsive UI
    setPropertyValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Debounce the actual dispatch to the reducer
    debouncedUpdateWidget(key, value);
  };

  const parentPlugin = findPluginByGid(allAvailablePlugins, widget.gid);
  const algos = (widget.dependencies || [])
    .map((dep) => {
      if (!dep.cid) {
        return undefined;
      }
      const gid = dep.gid || widget.gid;
      return findAlgoFromPluginsById(allAvailablePlugins, gid, dep.cid);
    })
    .filter((algo) => algo !== undefined);

  const inputBlocks = (widget.dependencies || [])
    .map((ib) => {
      if (!ib.cid) {
        return undefined;
      }
      const gid = ib.gid || widget.gid;
      return findInputBlockFromPluginsById(allAvailablePlugins, gid, ib.cid);
    })
    .filter((ib) => ib !== undefined);
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
              Widget Information
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
                    {algos.map((algo) => {
                      if (!algo) return null;
                      const testResultForThisAlgo = testResultsUsed
                        ? findTestResultByAlgoGidAndCid(
                            testResultsUsed,
                            algo.gid,
                            algo.cid
                          )
                        : null;
                      return (
                        <li
                          key={algo.cid}
                          className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-gray-400">
                          {/* <div className="mb-2 h-[1px] w-full bg-gray-500" /> */}
                          <h3 className="text-[0.9rem] font-semibold">
                            {algo.name}
                          </h3>
                          <p className="text-[0.8rem]">{algo.description}</p>
                          <div className="ml-5 flex flex-col items-start gap-1">
                            <div className="mt-8 flex items-center gap-2 text-gray-500">
                              <RiFlaskFill className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                              <h2 className="text-[0.8rem] font-semibold">
                                Test(s) results
                              </h2>
                            </div>
                            {!testResultForThisAlgo ? (
                              <div className="mb-1 text-[0.8rem] text-blue-600">
                                Currently using mock data
                              </div>
                            ) : (
                              <ul>
                                <li
                                  key={testResultForThisAlgo.id}
                                  className="mb-1 flex flex-col items-start gap-1">
                                  <div className="flex flex-col">
                                    <div className="text-[0.8rem] text-blue-600">
                                      <span className="font-semibold">ID:</span>{' '}
                                      {testResultForThisAlgo.id}
                                    </div>
                                    <div className="text-[0.8rem] text-blue-600">
                                      <span className="font-semibold">
                                        Name:
                                      </span>{' '}
                                      {testResultForThisAlgo.name}
                                    </div>
                                    <div className="text-[0.8rem] text-blue-600">
                                      <span className="font-semibold">
                                        Created:
                                      </span>{' '}
                                      {new Date(
                                        testResultForThisAlgo.created_at + "Z"
                                      ).toLocaleString()}
                                    </div>
                                    <div className="text-[0.8rem] text-blue-600">
                                      <span className="font-semibold">
                                        Updated:
                                      </span>{' '}
                                      {new Date(
                                        testResultForThisAlgo.updated_at + "Z"
                                      ).toLocaleString()}
                                    </div>
                                    <div className="text-[0.8rem] text-blue-600">
                                      <span className="font-semibold">
                                        Version:
                                      </span>{' '}
                                      {testResultForThisAlgo.version}
                                    </div>
                                  </div>
                                </li>
                              </ul>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
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
                    {inputBlocks.map((ib) => {
                      if (!ib) return null;
                      return (
                        <li
                          key={ib.cid}
                          className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-gray-400">
                        {/* <div className="mb-2 h-[1px] w-full bg-gray-500" /> */}
                        <h3 className="text-[0.9rem] font-semibold">
                          {ib.name}
                        </h3>
                        <p className="text-[0.8rem]">{ib.description}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="ml-5 flex flex-col items-start gap-1">
                <div className="mt-8 flex items-center gap-2 text-gray-500">
                  <RiSurveyFill className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                  <h2 className="text-[0.8rem] font-semibold">
                    User Input Data
                  </h2>
                </div>
                {!inputBlocksDataUsed || inputBlocksDataUsed.length === 0 ? (
                  <div className="mb-1 text-[0.8rem] text-blue-600">
                    Currently using mock data
                  </div>
                ) : (
                  <ul>
                    {inputBlocksDataUsed.map((inputBlockData) => (
                      <li
                        key={inputBlockData.id}
                        className="ml-2 mt-1 flex flex-col items-start gap-1 p-0 text-blue-600">
                        <div className="flex flex-col">
                          <div className="text-[0.8rem]">
                            <span className="font-semibold">ID:</span>{' '}
                            {inputBlockData.id}
                          </div>
                          <div className="text-[0.8rem]">
                            <span className="font-semibold">Name:</span>{' '}
                            {inputBlockData.name}
                          </div>
                          <div className="text-[0.8rem]">
                            <span className="font-semibold">Group:</span>{' '}
                            {inputBlockData.group}
                          </div>
                          <div className="text-[0.8rem]">
                            <span className="font-semibold">Created:</span>{' '}
                            {new Date(
                              inputBlockData.created_at + "Z"
                            ).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Divider />
            </React.Fragment>
          ) : null}

          {/* Widget Properties Section */}
          {widget.properties && widget.properties.length > 0 ? (
            <React.Fragment>
              <div className="mt-8 flex flex-col items-start gap-1 text-gray-500">
                <div className="flex items-center gap-2">
                  <RiSettings4Line className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                  <h2 className="text-[0.9rem] font-semibold">
                    Widget Custom Properties
                  </h2>
                </div>
                <div className="w-full">
                  {widget.properties.map((property: WidgetProperty) => (
                    <div
                      key={property.key}
                      className="mb-4">
                      <label
                        htmlFor={`property-${property.key}`}
                        className="mb-1 block text-[0.9rem] font-semibold text-gray-500">
                        {property.key}
                      </label>
                      <p className="mb-2 text-[0.8rem] text-gray-400">
                        {property.helper}
                      </p>
                      <input
                        id={`property-${property.key}`}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-[0.9rem] text-gray-700 focus:border-primary-500 focus:outline-none"
                        value={propertyValues[property.key] || ''}
                        onChange={(e) =>
                          handlePropertyChange(property.key, e.target.value)
                        }
                        placeholder={property.default}
                      />
                    </div>
                  ))}
                </div>
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
      <div className="absolute right-0 top-0 z-20 bg-white text-xs text-gray-300">
        {widget.gridItemId}
      </div>
    </Drawer>
  </div>
);
}

export { WidgetPropertiesDrawer };
