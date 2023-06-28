import { GetServerSideProps } from 'next';
import ReportStatusModule from 'src/modules/reportStatus';
import { Report } from 'src/types/project.interface';
import { getReport } from 'server/lib/projectServiceBackend';
import PluginManagerType from 'src/types/pluginManager.interface';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  if (!params || !params.id) {
    console.log('url parameter required - id');
    return { notFound: true };
  }

  const id = params.id as string;
  const report = await getReport(id);
  return {
    props: {
      report,
    },
  };
};

type Props = {
  report: Report;
  pluginManager: PluginManagerType;
};

export default function ReportStatusPage({ report }: Props) {
  return <ReportStatusModule report={report} />;
}
