import { notFound } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { Icon } from '@/lib/components/IconSVG';
import { IconName } from '@/lib/components/IconSVG';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
import ActionButtons from './components/ActionButtons';
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
    <main className="w-full p-6">
      <div className="mb-1 flex items-start justify-between">
        {/* Left section: Icon + Text */}
        <div className="flex items-center">
          <Icon
            name={IconName.OpenedBook}
            size={40}
            color="#FFFFFF"
          />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">
              {flow === UserFlows.NewProject && project
                ? `Select A Report Template for ${project.projectInfo.name}`
                : 'Report Templates'}
            </h1>
            <p className="text-secondary-300">
              {flow === UserFlows.NewProject && project
                ? 'Select a template or start with an empty canvas.'
                : 'Browse and manage report templates.'}
            </p>
          </div>
        </div>

        <div className="flex h-[126px] items-center">
          {flow === UserFlows.NewProject && project ? null : <ActionButtons />}
        </div>
      </div>

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
