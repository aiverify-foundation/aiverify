import React, { useState, useEffect, useRef, forwardRef } from 'react';


import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { WIDTH, COLUMNS, ROW_HEIGHT } from 'src/lib/reportUtils';
import {
  getItemLayoutProperties,
  useWidgetProperties,
} from 'src/lib/canvasUtils';
import { ReportWidgetItem, Page } from 'src/types/projectTemplate.interface';
import { Report } from 'src/types/project.interface';
import ReportWidgetComponent, {
  ReportWidgetComponentProps,
} from './reportWidget';
import styles from './styles/printView.module.css';
import sharedStyles from '../projectTemplate/styles/shared/reportDefault.module.css';
import { TestEngineTaskStatus } from '../../types/test.interface';
import clsx from 'clsx';

const COL_WIDTH = WIDTH / COLUMNS;

interface PageExtended extends Page {
  hasDynamicHeight: boolean;
}

type MyDynamicHeightPageProps = {
  page: PageExtended;
  pageno: number;
  numPages: number,
  widgetComps: any;
  report: Report;
}

function MyDynamicHeightPage ({ page, pageno, numPages, widgetComps, report }: MyDynamicHeightPageProps) {
  return (
    <>
      <div 
        className={clsx(
          styles.page,
          sharedStyles.printPage,
        )}
        style={{
          pageBreakBefore: pageno > 0 ? 'always':'avoid',
        }}>
        {page.reportWidgets?.map(item => {
          const comp = widgetComps[item.key];
          const width = comp.layoutItem.w * COL_WIDTH;
          const left = comp.layoutItem.x * COL_WIDTH;
          const top = comp.layoutItem.y * ROW_HEIGHT;
          const height=comp.meta.dynamicHeight?'max-content':comp.layoutItem.h*ROW_HEIGHT;
          return (
            <div
              key={item.key}
              className={styles.reportWidgetComponent}
              style={{
                display: 'flex',
                ...getItemLayoutProperties(comp.reportWidget.layoutItemProperties),
                float: 'left',
                position: 'relative',
                width,
                height,
                marginRight: -WIDTH,
                marginLeft: left,
                marginTop: top,
              }}
            >
              <ReportWidgetComponent
                mdxBundle={comp.mdxBundle}
                inputBlockData={report.projectSnapshot.inputBlockData}
                result={comp.result}
                properties={comp.properties}
                meta={comp.meta}
                report={report}
              />
            </div>
          )
        })}
      </div>
      {page.hasDynamicHeight && pageno < (numPages-1) && <div style={{ pageBreakAfter:'always' }}></div>}
    </>
  )
}

type Props = {
  report: Report;
  mdxBundleMap: any;
};

/**
 * Main project module component
 */
export default function PrintViewModule({ report, mdxBundleMap }: Props) {
  const [ pages, setPages ] = useState<PageExtended[]>([]);
  const widgetProperties = useWidgetProperties(report.projectSnapshot);
  const [reportContext, setReportContext] = useState<{
    [key: string]: ReportWidgetComponentProps;
  }>({});
  const [widgetComps, setWidgetComps] = useState<any | null>(null);

  useEffect(() => {
    const pages = report.projectSnapshot.pages as PageExtended[];

    const result = {} as any;
    if (report.tests) {
      for (const test of report.tests) {
        if (test.status == TestEngineTaskStatus.Success)
          result[test.algorithmGID] = test.output;
        else result[test.algorithmGID] = null;
      }
    }
    const widgetComps: any = {};
    for (const page of pages) {
      page.hasDynamicHeight = false;
      for (const layout of page.layouts) {
        if (layout.i === '_youcantseeme') continue;
        const reportWidget = page.reportWidgets.find((e) => e.key == layout.i);
        if (!reportWidget) {
          console.warn('Invalid widget key', layout);
          continue;
        }
        const comp = getWidget(reportWidget, layout, result);
        widgetComps[reportWidget.key] = comp;
        if (comp.meta.dynamicHeight)
          page.hasDynamicHeight = true;
      }
    }
    setPages(pages);

    setWidgetComps(widgetComps);
  }, [report.projectSnapshot.pages]);

  const getWidget = (
    reportWidget: ReportWidgetItem,
    layoutItem: any,
    result: any
  ) => {
    const properties: any = {};

    if (reportWidget.properties) {
      for (const key of Object.keys(reportWidget.properties)) {
        properties[key] = widgetProperties.getProperty(
          reportWidget.properties[key]
        );
      }
    }
    const comp = {
      reportWidget,
      mdxBundle: mdxBundleMap[reportWidget.widgetGID],
      meta: mdxBundleMap[reportWidget.widgetGID].widget,
      properties: properties,
      layoutItem,
      result, 
    }
    return comp;
  }

  const numPages = pages.length;

  return (
    <div
      className={clsx(
        styles.pageContainer,
        sharedStyles.reportRoot,
        sharedStyles.reportContainer
      )}>
      {widgetComps &&
        reportContext &&
        pages.map((page, pageno) => (
          <MyDynamicHeightPage
            key={`page-${pageno}`}
            page={page}
            pageno={pageno}
            numPages={numPages}
            widgetComps={widgetComps}
            report={report}
          />
      ))}
    </div>
  );
}
