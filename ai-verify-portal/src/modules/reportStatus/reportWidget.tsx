import { useMemo, useRef, useState, useEffect } from 'react';
import { getMDXComponent } from 'mdx-bundler/client';
import { Report } from 'src/types/project.interface';
import moment from 'moment';

import 'ai-verify-shared-library/styles.css';
import styles from '../projectTemplate/styles/shared/reportWidget.module.css';

export type ReportWidgetComponentProps = {
  mdxBundle: any;
  inputBlockData?: any;
  result?: any;
  meta?: any;
  properties?: any;
  report: Report;
};

export default function ReportWidgetComponent({
  mdxBundle,
  inputBlockData,
  result,
  meta,
  properties,
  report,
}: ReportWidgetComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { code, frontmatter } = mdxBundle;
  const Component = useMemo(() => getMDXComponent(code), [code]);
  const tests = report.tests || [];
  const timeTaken =
    report.timeTaken > report.totalTestTimeTaken
      ? report.timeTaken
      : report.totalTestTimeTaken;
  const reportDate = moment(report.timeStart).add(timeTaken, 'seconds');
  const [frozen, setFrozen] = useState<any>(null);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    const obj = Object.freeze({
      inputBlockData: inputBlockData || {},
      result: result || {},
      meta: meta || {},
      properties: properties || {},
      getContainerObserver: (
        callback: (width: number, height: number) => void
      ) => {
        resizeObserver = new ResizeObserver(() => {
          if (ref.current && ref.current.parentElement) {
            callback(
              ref.current.parentElement.offsetWidth - 20,
              ref.current.parentElement.offsetHeight - 20
            );
          }
        });
        if (ref.current && ref.current.parentElement)
          resizeObserver.observe(ref.current.parentElement);
        return resizeObserver;
      },
      container: { width: '100%', height: '100%' },
      // additional properties added
      getResults(cid: string, gid: null | string = null) {
        const key =
          gid && gid.length > 0 ? `${gid}:${cid}` : `${meta.pluginGID}:${cid}`;
        return result[key];
      },
      getIBData(cid: string, gid: null | string = null) {
        const key =
          gid && gid.length > 0 ? `${gid}:${cid}` : `${meta.pluginGID}:${cid}`;
        return inputBlockData[key];
      },
      report: {
        timeStart: report.timeStart,
        timeTaken,
        totalTestTimeTaken: report.totalTestTimeTaken,
        reportDate: reportDate.toDate(),
      },
      modelAndDatasets: report.projectSnapshot.modelAndDatasets,
      tests: tests,
      getTest(cid: string, gid: null | string = null) {
        if (!tests) return undefined;
        const key =
          gid && gid.length > 0 ? `${gid}:${cid}` : `${meta.pluginGID}:${cid}`;
        return tests.find((k) => k.algorithmGID === key);
      },
    });
    setFrozen(obj);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [ref]);

  if (!frozen) return <div></div>;

  try {
    return (
      <div ref={ref} className={styles.widgetContainer}>
        <Component {...frozen} frontmatter={frontmatter} />
      </div>
    );
  } catch (e) {
    return <div></div>;
  }
}
