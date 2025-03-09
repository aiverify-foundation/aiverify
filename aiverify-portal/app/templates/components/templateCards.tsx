'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Card } from '@/lib/components/card/card';
import { Modal } from '@/lib/components/modal';
import { patchProject } from '@/lib/fetchApis/getProjects';
import {
  RiDeleteBinFill,
  RiEyeFill,
  RiFileCopy2Line,
  RiFileCopyLine,
  RiPencilFill,
} from '@remixicon/react';

type TemplateCardsProps = {
  templates: ReportTemplate[];
  projectId?: string;
  flow?: UserFlows;
};

function TemplateCards({ templates, projectId, flow }: TemplateCardsProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewProjectWithTemplate = async (template: ReportTemplate) => {
    if (!projectId) return;

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
  };

  const handleViewTemplate = (
    template: ReportTemplate,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    router.push(
      `/canvas?templateId=${template.id}&flow=${UserFlows.ViewTemplate}&mode=view`
    );
  };

  const handleEditTemplate = (
    template: ReportTemplate,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    router.push(
      `/canvas?templateId=${template.id}&flow=${UserFlows.ViewTemplate}&mode=edit`
    );
  };

  const handleCloneTemplate = async (
    template: ReportTemplate,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `/api/project_templates/clone/${template.id}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clone template');
      }

      const clonedTemplate = await response.json();
      // Refresh the page to show the new template
      router.refresh();
    } catch (error) {
      console.error('Error cloning template:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to clone template'
      );
    }
  };

  const handleDeleteTemplate = async (
    template: ReportTemplate,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/project_templates/${selectedTemplate.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Close modal and refresh the page
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete template'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <React.Fragment>
      {showDeleteModal && selectedTemplate && (
        <Modal
          heading="Delete Template"
          className="bg-secondary-800"
          textColor="#FFFFFF"
          enableScreenOverlay
          primaryBtnLabel={isDeleting ? 'Deleting...' : 'Delete'}
          secondaryBtnLabel="Cancel"
          onCloseIconClick={() => setShowDeleteModal(false)}
          onPrimaryBtnClick={confirmDelete}
          onSecondaryBtnClick={() => setShowDeleteModal(false)}>
          <div className="flex flex-col gap-4">
            <p>
              Are you sure you want to delete template "
              {selectedTemplate.projectInfo.name}"?
            </p>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </Modal>
      )}

      {templates.map((template) => (
        <Card
          key={template.id}
          size="md"
          width={450}
          height={250}
          className="cursor-pointer !bg-none text-white text-shadow-sm [&&]:bg-secondary-900"
          onClick={() =>
            flow === UserFlows.NewProject
              ? handleNewProjectWithTemplate(template)
              : handleViewTemplate(template)
          }>
          <Card.Content className="flex flex-col gap-7 p-4">
            <h3 className="text-[1.2rem] font-bold">
              {template.projectInfo.name}
            </h3>
            <p>{template.projectInfo.description}</p>
          </Card.Content>
          <Card.SideBar className="flex flex-col items-center gap-4 border-l border-l-primary-400 py-4">
            <button
              onClick={(e) => handleViewTemplate(template, e)}
              className="transition-colors hover:fill-primary-100">
              <RiEyeFill
                size={25}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </button>
            <button
              onClick={(e) => handleEditTemplate(template, e)}
              className="transition-colors hover:fill-primary-100">
              <RiPencilFill
                size={27}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </button>
            <button
              onClick={(e) => handleCloneTemplate(template, e)}
              className="transition-colors hover:fill-primary-100">
              <RiFileCopyLine
                size={27}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </button>
            <button
              onClick={(e) => handleDeleteTemplate(template, e)}
              className="transition-colors hover:fill-primary-100">
              <RiDeleteBinFill
                size={27}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </button>
          </Card.SideBar>
        </Card>
      ))}
    </React.Fragment>
  );
}

export { TemplateCards };
