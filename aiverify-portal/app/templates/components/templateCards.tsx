'use client';
import React, { useState } from 'react';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import Link from 'next/link';

type TemplateCardsProps = {
  templates: ReportTemplate[];
  projectId?: string;
  flow?: UserFlows;
};

function TemplateCards({ templates, projectId, flow }: TemplateCardsProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);

  const getTemplateLink = (templateId: number) => {
    if (flow === UserFlows.NewProject && projectId) {
      return `/project/usermenu?flow=${UserFlows.NewProjectWithExistingTemplate}&projectId=${projectId}&templateId=${templateId}`;
    }
    return `/templates/${templateId}`;
  };

  return (
    <React.Fragment>
      {templates.map((template) => (
        <Link key={template.id} href={getTemplateLink(template.id)}>
          <Card
            size="md"
            width={450}
            className="!bg-none text-white text-shadow-sm [&&]:bg-secondary-900">
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
        </Link>
      ))}
    </React.Fragment>
  );
}

export { TemplateCards };
