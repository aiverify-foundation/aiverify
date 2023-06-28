import { GetServerSideProps } from 'next';

import PrintViewModule from 'src/modules/reportStatus/printView';
import { Report } from 'src/types/project.interface';
import { getReport } from 'server/lib/projectServiceBackend';
import { getMDXBundle } from 'server/bundler';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  if (!params || !params.id) {
    console.log('url parameter required - id');
    return { notFound: true };
  }
  const id = params.id as string;
  const report = await getReport(id);
  const mdxBundleMap = {} as any;
  for (const page of report.projectSnapshot.pages) {
    for (const widget of page.reportWidgets) {
      if (!(widget.widgetGID in mdxBundleMap)) {
        try {
          const bundle = await getMDXBundle(widget.widgetGID);
          if (bundle) mdxBundleMap[widget.widgetGID] = bundle;
          else mdxBundleMap[widget.widgetGID] = null;
        } catch (e) {
          console.log('Error getting mdx bundle for', widget.widgetGID);
          mdxBundleMap[widget.widgetGID] = null;
        }
      }
    }
  }

  return {
    props: {
      report,
      mdxBundleMap,
    },
  };
};

type Props = {
  report: Report;
  mdxBundleMap: any;
};

export default function PrintViewPage({ report, mdxBundleMap }: Props) {
  return <PrintViewModule report={report} mdxBundleMap={mdxBundleMap} />;
}
