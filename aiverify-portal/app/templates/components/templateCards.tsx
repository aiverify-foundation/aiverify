'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { patchProject } from '@/lib/fetchApis/getProjects';

type TemplateCardsProps = {
  templates: ReportTemplate[];
  projectId?: string;
  flow?: UserFlows;
};

function TemplateCards({ templates, projectId, flow }: TemplateCardsProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);

  const handleTemplateClick = async (template: ReportTemplate) => {
    if (flow === UserFlows.NewProject && projectId) {
      try {
        // Update project with template data
        await patchProject(projectId, {
          templateId: template.id.toString(),
          pages: template.pages,
          projectInfo: {
            name: template.projectInfo.name,
            description: template.projectInfo.description,
            reportTitle: template.projectInfo.name,
            company: '',
          },
          globalVars: template.globalVars,
        });
        // Navigate to template with existing template flow
        router.push(
          `/project/select_data/?flow=${UserFlows.NewProjectWithExistingTemplate}&projectId=${projectId}`
        );
      } catch (error) {
        console.error('Error selecting template:', error);
      }
    } else {
      // For non-new project flows, navigate to template details
      router.push(`/templates/${template.id}`);
    }
  };

  return (
    <React.Fragment>
      {templates.map((template) => (
        <Card
          key={template.id}
          size="md"
          width={450}
          height={250}
          className="cursor-pointer !bg-none text-white text-shadow-sm [&&]:bg-secondary-900"
          onClick={() => handleTemplateClick(template)}>
          <Card.Content className="flex flex-col gap-7 p-4">
            <h3 className="text-[1.2rem] font-bold">
              {template.projectInfo.name}
            </h3>
            <p>{template.projectInfo.description}</p>
          </Card.Content>
          <Card.SideBar className="flex flex-col items-center gap-4 border-l border-l-primary-400 py-4">
            <Icon
              size={25}
              name={IconName.SolidBox}
              svgClassName="fill-primary-300 dark:fill-primary-300"
            />
            <Icon
              size={27}
              name={IconName.HistoryClock}
              svgClassName="fill-primary-300 dark:fill-primary-300"
            />
            <Icon
              size={27}
              name={IconName.Tools}
              svgClassName="fill-primary-300 dark:fill-primary-300"
            />
          </Card.SideBar>
        </Card>
      ))}
    </React.Fragment>
  );
}

export { TemplateCards };
