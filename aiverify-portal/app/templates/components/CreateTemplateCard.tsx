'use client';

import { RiFileChartFill } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/TremurCard';
import { useCreateTemplate } from '@/lib/fetchApis/getTemplates';

type CreateTemplateCardProps = {
  projectId?: string;
  flow?: UserFlows;
};

export function CreateTemplateCard({
  projectId,
  flow,
}: CreateTemplateCardProps) {
  const router = useRouter();
  const createTemplate = useCreateTemplate();

  const handleClick = async (e: React.MouseEvent) => {
    if (flow === UserFlows.NewProject && projectId) return;

    e.preventDefault();
    try {
      const newTemplate = await createTemplate.mutateAsync();
      router.push(
        `/canvas?templateId=${newTemplate.id}&flow=${UserFlows.ViewTemplate}&mode=edit`
      );
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  return (
    <Link
      href={
        flow === UserFlows.NewProject && projectId
          ? `/canvas?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=${projectId}&mode=edit`
          : '#'
      }
      onClick={handleClick}>
      <Card className="min-h-[250px] w-[450px] cursor-pointer border-none bg-secondary-700 text-white hover:bg-secondary-700">
        <h3 className="mb-8 flex text-xl font-semibold text-white">
          <RiFileChartFill className="mr-2 h-8 w-8 text-primary-500" /> Create
          New Report Template
        </h3>
        <p className="leading-6 text-white">
          Start from scratch and design your own template. Drag widgets from the
          sidebar and drop them onto the canvas to build your custom report.
        </p>
      </Card>
    </Link>
  );
}
