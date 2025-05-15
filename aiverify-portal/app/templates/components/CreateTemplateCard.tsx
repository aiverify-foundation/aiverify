'use client';

import { RiFileChartFill } from '@remixicon/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/TremurCard';
import { Modal } from '@/lib/components/modal';
import { patchProject } from '@/lib/fetchApis/getProjects';
import { NewTemplateForm } from './NewTemplateForm';

type CreateTemplateCardProps = {
  projectId?: string;
  flow?: UserFlows;
};

export function CreateTemplateCard({
  projectId,
  flow,
}: CreateTemplateCardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    if (
      flow != UserFlows.NewProject &&
      flow != UserFlows.ViewTemplate &&
      flow != UserFlows.NewTemplate &&
      projectId
    ) {
      e.preventDefault();
      try {
        // Update project with blank template
        await patchProject(projectId, {
          pages: [],
        });
        router.push(
          `/canvas?flow=${UserFlows.NewProjectWithNewTemplate}&projectId=${projectId}&mode=edit`
        );
      } catch (error) {
        console.error(error);
      }
      return;
    } else if (flow === UserFlows.NewProject && projectId) {
      return;
    }
    e.preventDefault();
    setShowForm(true);
  };

  return (
    <>
      {showForm ? (
        <Modal
          heading="Create New Template"
          className="bg-secondary-800"
          textColor="#FFFFFF"
          enableScreenOverlay
          width={600}
          height={400}
          onCloseIconClick={() => setShowForm(false)}>
          <NewTemplateForm onCancel={() => setShowForm(false)} />
        </Modal>
      ) : null}
      <Link
        href={
          flow != UserFlows.ViewTemplate &&
          flow != UserFlows.NewTemplate &&
          projectId
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
            Start from scratch and design your own template. Drag widgets from
            the sidebar and drop them onto the canvas to build your custom
            report.
          </p>
        </Card>
      </Link>
    </>
  );
}
