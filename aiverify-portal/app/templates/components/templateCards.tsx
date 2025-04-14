'use client';
import {
  RiDeleteBinFill,
  RiEyeFill,
  RiFileCopyLine,
  RiPencilFill,
} from '@remixicon/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ReportTemplate } from '@/app/templates/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/card/card';
import { Modal } from '@/lib/components/modal';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in project flow (any flow that's not template-related)
  const isProjectFlow =
    flow !== undefined &&
    flow !== UserFlows.ViewTemplate &&
    flow !== UserFlows.NewTemplate;

  const handleNewProjectWithTemplate = async (template: ReportTemplate) => {
    if (!projectId) return;

    try {
      console.log('here new project with template', template.id);
      // Update project with template data
      await patchProject(projectId, {
        templateId: template.id.toString(),
        pages: template.pages,
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

    // If in project flow, handle it differently
    if (isProjectFlow && projectId) {
      try {
        console.log('here existing');
        // Only update pages and globalVars without templateId
        patchProject(projectId, {
          pages: template.pages,
          globalVars: template.globalVars,
        }).then(() => {
          // Navigate to canvas with the EditTemplateInProjectFlow flow
          router.push(
            `/canvas?projectId=${projectId}&flow=${UserFlows.NewProjectWithEditingExistingTemplate}&mode=edit`
          );
        });
      } catch (error) {
        console.error('Error selecting template for editing:', error);
      }
    } else {
      // Default behavior for non-project flow
      router.push(
        `/canvas?templateId=${template.id}&flow=${UserFlows.ViewTemplate}&mode=edit`
      );
    }
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
              Are you sure you want to delete template &quot;
              {selectedTemplate.projectInfo.name}&quot;?
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
            isProjectFlow
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
            {/* Only show the appropriate icons based on the flow */}
            {!isProjectFlow && (
              <button
                onClick={(e) => handleViewTemplate(template, e)}
                className="transition-colors hover:fill-primary-100">
                <RiEyeFill
                  size={25}
                  className="fill-primary-300 dark:fill-primary-300"
                />
              </button>
            )}

            {/* Always show the edit icon */}
            {/* Only show delete button if template is not from a plugin */}
            {!template.fromPlugin && (
              <button
                onClick={(e) => handleEditTemplate(template, e)}
                className="transition-colors hover:fill-primary-100">
                <RiPencilFill
                  size={27}
                  className="fill-primary-300 dark:fill-primary-300"
                />
              </button>
            )}

            {/* Only show clone and delete in non-project flow */}
            {!isProjectFlow && (
              <>
                <button
                  onClick={(e) => handleCloneTemplate(template, e)}
                  className="transition-colors hover:fill-primary-100">
                  <RiFileCopyLine
                    size={27}
                    className="fill-primary-300 dark:fill-primary-300"
                  />
                </button>
                {/* Only show delete button if template is not from a plugin */}
                {!template.fromPlugin && (
                  <button
                    onClick={(e) => handleDeleteTemplate(template, e)}
                    className="transition-colors hover:fill-primary-100">
                    <RiDeleteBinFill
                      size={27}
                      className="fill-primary-300 dark:fill-primary-300"
                    />
                  </button>
                )}
              </>
            )}
          </Card.SideBar>
        </Card>
      ))}
    </React.Fragment>
  );
}

export { TemplateCards };
