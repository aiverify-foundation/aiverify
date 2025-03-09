import { RiFileChartFill } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/TremurCard';
import { getProjects } from '@/lib/fetchApis/getProjects';
import {
  fetchTemplates,
  useCreateTemplate,
} from '@/lib/fetchApis/getTemplates';
import { CreateTemplateCard } from './components/CreateTemplateCard';
import { QueryProvider } from './components/QueryProvider';
import { TemplateCards } from './components/templateCards';
import { TemplateFilters } from './components/templateFilters';

type UrlSearchParams = {
  searchParams: {
    projectId?: string;
    flow?: UserFlows;
  };
};

export default async function TemplatesPage(props: UrlSearchParams) {
  const params = await props.searchParams;
  const { projectId, flow } = params;

  let project;
  if (flow === UserFlows.NewProject && projectId) {
    const result = await getProjects({ ids: [projectId] });
    if ('message' in result || result.data.length === 0) {
      console.log(`project id not found: ${projectId}`);
      notFound();
    }
    project = result.data[0];
  }

  const response = await fetchTemplates();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const templates = response.data;

  return (
    <main className="w-full px-6">
      <h1 className="mb-0 mt-6 text-2xl font-bold tracking-wide">
        {flow === UserFlows.NewProject && project
          ? `Select A Report Template for ${project.projectInfo.name}`
          : 'Report Templates'}
      </h1>
      <p className="mb-[80px] text-secondary-300">
        {flow === UserFlows.NewProject && project
          ? 'Select a template or start with an empty canvas.'
          : 'Browse and manage report templates.'}
      </p>
      {templates.length > 1 ? <TemplateFilters /> : null}
      <section className="mt-6 flex flex-wrap gap-6">
        <QueryProvider>
          <CreateTemplateCard
            projectId={projectId}
            flow={flow}
          />
        </QueryProvider>
        <TemplateCards
          templates={templates}
          projectId={projectId}
          flow={flow}
        />
      </section>
    </main>
  );
}
