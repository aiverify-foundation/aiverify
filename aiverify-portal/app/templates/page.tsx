import Link from 'next/link';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/Card';
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
  const { projectId, flow } = props.searchParams;
  const response = await fetchTemplates();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const templates = response.data;

  return (
    <main className="h-screen w-full px-6">
      <h1 className="mb-0 mt-6 text-2xl font-bold tracking-wide">
        Select A Report Template
      </h1>
      <p className="mb-[80px] text-secondary-300">
        Select a template or start with an empty canvas.
      </p>
      {templates.length > 1 ? <TemplateFilters /> : null}
      <section className="mt-6 flex flex-wrap gap-6">
        <Link
          href={`/canvas?flow=${UserFlows.NewProjectWithExistingTemplate}&projectId=${projectId}`}>
          <Card className="min-h-[250px] max-w-lg cursor-pointer border-none bg-secondary-800 text-white hover:bg-secondary-700">
            <h3 className="mb-4 text-xl font-semibold text-white">
              Create New Report Template
            </h3>
            <p className="mt-2 leading-6 text-white">
              Start from scratch and design your own template. Drag widgets from
              the sidebar and drop them onto the canvas to build your custom
              report layout.
            </p>
          </Card>
        </Link>
        <TemplateCards templates={templates} />
      </section>
    </main>
  );
}
