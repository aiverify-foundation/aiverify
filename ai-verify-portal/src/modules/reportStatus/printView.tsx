import { useState, useEffect } from 'react';

import GridLayout from "react-grid-layout";

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { MAX_ROWS, ROW_HEIGHT, WIDTH } from 'src/lib/reportUtils';
import { getItemLayoutProperties, useWidgetProperties } from 'src/lib/canvasUtils';
import { ReportWidgetItem, } from 'src/types/projectTemplate.interface';
import { Report } from 'src/types/project.interface';
import ReportWidgetComponent, { ReportWidgetComponentProps } from './reportWidget';
import styles from './styles/printView.module.css';
import sharedStyles from '../projectTemplate/styles/shared/reportDefault.module.css';
import { TestEngineTaskStatus } from '../../types/test.interface';
import clsx from 'clsx';

type Props = {
  report: Report;
  mdxBundleMap: any;
}

/**
 * Main project module component
 */
export default function PrintViewModule({ report, mdxBundleMap }: Props) {
  const widgetProperties = useWidgetProperties(report.projectSnapshot);
  const [reportContext, setReportContext] = useState<{[key: string]: ReportWidgetComponentProps}>({});
  const [widgetComps, setWidgetComps] = useState<any|null>(null);

  useEffect(() => {
    const result = {} as any;
    if (report.tests) {
      for (const test of report.tests) {
        if (test.status == TestEngineTaskStatus.Success)
          result[test.algorithmGID] = test.output;
        else
          result[test.algorithmGID] = null;
      }
    }
    const widgetComps: any = {};
    for (const page of report.projectSnapshot.pages) {
      for (const layout of page.layouts) {
        if (layout.i === "_youcantseeme")
          continue;
        const reportWidget = page.reportWidgets.find(e => e.key == layout.i);
        if (!reportWidget) {
          console.warn("Invalid widget key", layout);
          continue;
        }
        getWidget(reportWidget, layout, widgetComps, result)
      }
    }
    setWidgetComps(widgetComps);
  }, [])

  const getWidget = (reportWidget: ReportWidgetItem, layoutItem: any, widgetComps: any, result: any) => {
    console.log("getWidget", reportWidget)
    const properties: any = {};
    if (reportWidget.properties) {
      for (const key of Object.keys(reportWidget.properties)) {
        // properties2[key] = reportWidget.properties[key];
        properties[key] = widgetProperties.getProperty(reportWidget.properties[key]);
      }
    }
    if (mdxBundleMap[reportWidget.widgetGID]) {
      const comp = <Box key={reportWidget.key} data-grid={layoutItem}
        className={styles.reportWidgetComponent}
        sx={{ display: 'flex', ...getItemLayoutProperties(reportWidget.layoutItemProperties) }}
      >
        <ReportWidgetComponent
          mdxBundle={mdxBundleMap[reportWidget.widgetGID]}
          inputBlockData={report.projectSnapshot.inputBlockData}
          result={result}
          properties={properties}
          meta={mdxBundleMap[reportWidget.widgetGID].widget}
          report={report}
        ></ReportWidgetComponent>
      </Box>
      widgetComps[reportWidget.key] = comp;
    } else {
      const comp = <Box key={reportWidget.key} data-grid={layoutItem}
        className={styles.reportWidgetComponent}
      >
        <Typography variant='h5' color="error">Invalid Widget</Typography>
      </Box>
      widgetComps[reportWidget.key] = comp;
    }
  }

  return (
    <div className={clsx(
      styles.pageContainer,
      sharedStyles.reportRoot,
      sharedStyles.reportContainer)}>
      {widgetComps && reportContext && report.projectSnapshot && report.projectSnapshot.pages.map((page, pageno) => (
        <div key={`page-${pageno}`}
          className={clsx(
            styles.page,
            sharedStyles.printPage,
            sharedStyles.reportHeight
          )}
          style={{ breakBefore: pageno > 0 ? 'always':'avoid' }}>
          <GridLayout
              className="layout"
              layout={page.layouts}
              rowHeight={ROW_HEIGHT}
              margin={[0, 0]}
              width={WIDTH}
              compactType={null}
              maxRows={MAX_ROWS}
              preventCollision={true}
              isDraggable={false}
              isResizable={false}>
              {page.reportWidgets?.map(item => widgetComps[item.key])}
            </GridLayout>
            <div style={{ position:'absolute', bottom:0, right:0 }}>
              <Typography variant='body2'>Page {pageno+1} of {report.projectSnapshot.pages.length}</Typography>
            </div>
        </div>
      ))}
    </div>
  )
}