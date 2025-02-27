import { RiFileChartFill } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/TremurCard';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
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
  if (flow == undefined) {
    console.log('flow id is required');
    notFound();
  }

  if (flow == UserFlows.NewProject && projectId == undefined) {
    notFound();
  }

  const result = await getProjects({ ids: [projectId as string] });
  if ('message' in result) {
    notFound();
  }

  const response = await fetchTemplates();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const templates = response.data;

  return (
    <main className="w-full px-6">
      <h1 className="mb-0 mt-6 text-2xl font-bold tracking-wide">
        Select A Report Template
      </h1>
      <p className="mb-[80px] text-secondary-300">
        Select a template or start with an empty canvas.
      </p>
      {templates.length > 1 ? <TemplateFilters /> : null}
      <section className="mt-6 flex flex-wrap gap-6">
        <Link
          href={`/project/usermenu?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=${projectId}`}>
          <Card className="min-h-[250px] max-w-lg cursor-pointer border-none bg-secondary-800 text-white hover:bg-secondary-700">
            <h3 className="mb-8 flex text-xl font-semibold text-white">
              <RiFileChartFill className="mr-2 h-8 w-8 text-primary-500" />{' '}
              Create New Report Template
            </h3>
            <p className="leading-6 text-white">
              Start from scratch and design your own template. Drag widgets from
              the sidebar and drop them onto the canvas to build your custom
              report.
            </p>
          </Card>
        </Link>
        <TemplateCards templates={templates} />
      </section>
    </main>
  );
}
