import { notFound } from 'next/navigation';
import React from 'react';
import { ProjectInfo } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import ActionButtons from './components/ActionButton';
import TestResultsList from './components/TestResultsList';

type UrlSearchParams = {
  searchParams: {
    flow?: UserFlows;
    projectId?: string;
  };
};

export default async function ResultsPage(props: UrlSearchParams) {
  const params = await props.searchParams;
  const { flow, projectId } = params;

  let project: ProjectInfo | undefined;

  if (flow != undefined && projectId != undefined) {
    const result = await getProjects({ ids: [projectId] });
    if ('message' in result || result.data.length === 0) {
      console.log(`project id not found: ${projectId}`);
      notFound();
    }
    project = result.data[0];
  }

  const testResults = await getTestResults();
  console.log(
    flow === UserFlows.NewProjectWithExistingTemplate ||
      flow === UserFlows.NewProjectWithNewTemplate
  );

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center">
          <Icon
            name={IconName.Lightning}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            {(flow === UserFlows.NewProjectWithNewTemplate ||
              flow === UserFlows.NewProjectWithExistingTemplate) &&
            project ? (
              <React.Fragment>
                <h1 className="text-2xl font-bold text-white">
                  Test Results for {project.projectInfo.name}
                </h1>
                <h3 className="text-white">
                  Select Test Results that you want to use for the project
                  report
                </h3>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <h1 className="text-2xl font-bold text-white">Test Results</h1>
                <h3 className="text-white">View and manage test results</h3>
              </React.Fragment>
            )}
          </div>
        </div>

        {flow == undefined ? <ActionButtons /> : null}
      </div>
      <TestResultsList
        testResults={testResults}
        flow={flow}
        projectId={projectId}
        enableSelection={
          flow === UserFlows.NewProjectWithExistingTemplate ||
          flow === UserFlows.NewProjectWithNewTemplate
        }
      />
    </div>
  );
}
