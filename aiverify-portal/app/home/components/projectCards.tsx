'use client';
import React from 'react';
import { Project } from '@/app/types';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';

type ProjectCardsProps = {
  projects: Project[];
};

function ProjectCards({ projects }: ProjectCardsProps) {
  return (
    <React.Fragment>
      {projects.map((project) => (
        <Card
          key={project.id}
          size="md"
          width={450}
          className="!bg-none text-white text-shadow-sm [&&]:bg-secondary-900">
          <Card.Content className="flex flex-col gap-7 p-4">
            <h3 className="text-[1.2rem] font-bold">
              {project.projectInfo.name}
            </h3>
            <p>{project.projectInfo.description}</p>
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

export { ProjectCards };
