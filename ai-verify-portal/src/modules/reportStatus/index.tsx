import { useRouter } from 'next/router';

import { Report } from 'src/types/project.interface';
import GeneratingReportComponent from './generatingReport';
import { ReportDesignerHeader } from '../project/header';

type Props = {
  report: Report;
};

export default function ReportStatusModule({ report }: Props) {
  const router = useRouter();

  const goBack = () => {
    router.push(`/project/${report.projectID}`);
  };

  return (
    <div>
      <ReportDesignerHeader
        onBackBtnClick={goBack}
        isTemplate={false}
        disableSaveBtn
        disableSaveMenu
        designStep={10}
      />
      <div className="layoutContentArea">
        <div className="scrollContainer">
          <GeneratingReportComponent report={report} />
        </div>
      </div>
    </div>
  );
}
