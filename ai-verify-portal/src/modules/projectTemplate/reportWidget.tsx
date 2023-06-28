import { useContext, useMemo, useEffect, useState, useRef } from 'react';
import { getMDXComponent } from 'mdx-bundler/client';
import WidgetDataContext from './widgetDataContext';
import { getComponents } from 'ai-verify-shared-library/lib';
import { MDXBundle } from './api/widget';
import moment from 'moment';
import styles from './styles/shared/reportWidget.module.css';
import 'ai-verify-shared-library/styles.css';

const components = getComponents();

export type ReportWidgetComponentProps = {
  mykey: string;
  mdxBundle: MDXBundle;
  inputBlockData?: any;
  result?: any;
  meta?: any;
};

export default function ReportWidgetComponent(
  props: ReportWidgetComponentProps
) {
  const ref = useRef<HTMLDivElement>(null);
  const { mykey, mdxBundle, inputBlockData, result, meta } = props;
  const ctx = useContext(WidgetDataContext);
  const { code, frontmatter } = mdxBundle;
  const Component = useMemo(() => getMDXComponent(code), [code]);
  const [frozen, setFrozen] = useState<any>(null);

  useEffect(() => {
    const properties = ctx[mykey] ? ctx[mykey].properties : {};
    const timeStart = moment();
    const timeTaken = Math.floor(Math.random() * 1000 + 1);
    const reportDate = timeStart.add(timeTaken, 'seconds');
    let resizeObserver: ResizeObserver | null = null;
    const obj = Object.freeze({
      inputBlockData: inputBlockData || {},
      result: result || {},
      meta: meta || {},
      properties: { ...properties },
      getContainerObserver: (
        callback: (width: number, height: number) => void
      ) => {
        if (resizeObserver) return resizeObserver;
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
        timeStart: timeStart.toDate(),
        timeTaken,
        totalTestTimeTaken: timeTaken - 1,
        reportDate: reportDate.toDate(),
      },
      modelAndDatasets: {
        // todo: mock
        testDataset: {},
        model: {},
        groundTruthDataset: {},
        groundTruthColumn: 'Fake GroundTruth',
      },
      tests: [],
      getTest(cid: string, gid: null | string = null) {
        // todo mock based on input schema
        return undefined;
      },
    });
    setFrozen(obj);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [ctx]);

  if (!frozen) {
    return <div></div>;
  }

  return (
    <div
      ref={ref}
      className={styles.widgetContainer}
      key={`container-${mykey}`}>
      <Component
        {...frozen}
        frontmatter={frontmatter}
        components={components}
      />
    </div>
  );
}
