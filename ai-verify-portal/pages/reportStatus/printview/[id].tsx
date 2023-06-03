import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'

import PrintViewModule from 'src/modules/reportStatus/printView';
import {Report} from 'src/types/project.interface';
import { getReport } from 'server/lib/projectServiceBackend';
import { getMDXBundle } from 'server/bundler';

export const getServerSideProps: GetServerSideProps = async ({params}) => {
  const id = params!.id as string;
  const report = await getReport(id)
  let mdxBundleMap = {} as any; 
  for (let page of report.projectSnapshot.pages) {
    for (let widget of page.reportWidgets) {
      if (!(widget.widgetGID in mdxBundleMap)) {
        try {
          const bundle = await getMDXBundle(widget.widgetGID);
          if (bundle)
            mdxBundleMap[widget.widgetGID] = bundle;
          else  
            mdxBundleMap[widget.widgetGID] = null;
        } catch (e) {
          console.log("Error getting mdx bundle for", widget.widgetGID);
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
  }
}

type Props = {
  report: Report;
  mdxBundleMap: any;
}

export default function PrintViewPage({report, mdxBundleMap}: Props) {
  const router = useRouter()
  const { pid } = router.query

  return (<PrintViewModule report={report} mdxBundleMap={mdxBundleMap} />)
}