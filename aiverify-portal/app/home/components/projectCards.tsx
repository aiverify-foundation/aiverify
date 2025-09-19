'use client';
import { RiDeleteBinLine, RiEyeLine, RiPencilFill } from '@remixicon/react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Project, InputBlockGroupData } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { Card } from '@/lib/components/card/card';
import { Modal } from '@/lib/components/modal/modal';

type ProjectCardsProps = {
  projects: Project[];
};

function ProjectCards({ projects: initialProjects }: ProjectCardsProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [inputBlockGroups, setInputBlockGroups] = useState<InputBlockGroupData[]>([]);

  // Update internal state when props change
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Fetch input block groups data
  useEffect(() => {
    const fetchInputBlockGroups = async () => {
      try {
        const response = await fetch('/api/input_block_data/groups/');
        if (response.ok) {
          const data = await response.json();
          setInputBlockGroups(data);
        } else {
          console.error('Failed to fetch input block groups, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch input block groups:', error);
      }
    };

    fetchInputBlockGroups();
  }, []);

  // Helper function to determine if input blocks belong to a group and get the group ID
  const getInputBlockIds = (inputBlocks: { id: number; gid: string; cid: string }[]) => {
    if (inputBlocks.length === 0 || inputBlockGroups.length === 0) {
      return inputBlocks.map((block) => block.id).join(',');
    }

    // Check if all blocks have the same gid
    const firstBlock = inputBlocks[0];
    const allSameGid = inputBlocks.every(block => block.gid === firstBlock.gid);
    
    if (!allSameGid) {
      return inputBlocks.map((block) => block.id).join(',');
    }

    // All blocks have the same gid - check if they belong to a group
    const matchingGroup = inputBlockGroups.find(group => {
      if (group.gid !== firstBlock.gid) return false;
      
      // Check if all input block IDs are found in this group
      const groupBlockIds = group.input_blocks.map(ib => ib.id);
      const allBlocksInGroup = inputBlocks.every(block => 
        groupBlockIds.includes(block.id)
      );
      
      return allBlocksInGroup;
    });

    if (matchingGroup) {
      // All blocks belong to this group - use group ID for all
      return inputBlocks.map(() => matchingGroup.id).join(',');
    }

    // No matching group found - use individual IDs
    return inputBlocks.map((block) => block.id).join(',');
  };

  const handleDelete = async (project: Project) => {
    try {
      setIsDeleting(project.id);
      const response = await fetch(`/api/projects/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== project.id)
      );
      setDeleteResult({
        success: true,
        message: `Project "${project.projectInfo.name}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      setDeleteResult({
        success: false,
        message: `Failed to delete project "${project.projectInfo.name}". Please try again.`,
      });
    } finally {
      setIsDeleting(null);
      setProjectToDelete(null);
      setShowResultModal(true);
    }
  };

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
            <Link
              href={(() => {
                const iBlockIds = getInputBlockIds(project.inputBlocks as { id: number; gid: string; cid: string }[]);
                const url = `/canvas?flow=${UserFlows.EditExistingProjectWithResults}&projectId=${project.id}&modelId=${project.testModelId}&testResultIds=${(project.testResults as { id: number }[]).map((result) => result.id).join(',')}&iBlockIds=${iBlockIds}&mode=view`;
                return url;
              })()}>
              <RiEyeLine
                size={25}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </Link>
            <Link
              href={`/project/select_data?flow=${UserFlows.EditExistingProject}&projectId=${project.id}`}>
              <RiPencilFill
                size={27}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </Link>
            <button
              onClick={() => setProjectToDelete(project)}
              disabled={isDeleting === project.id}
              className="cursor-pointer disabled:opacity-50">
              <RiDeleteBinLine
                size={27}
                className="fill-primary-300 dark:fill-primary-300"
              />
            </button>
          </Card.SideBar>
        </Card>
      ))}

      {/* Confirmation Modal */}
      {projectToDelete && (
        <Modal
          heading="Confirm Delete"
          enableScreenOverlay={true}
          onCloseIconClick={() => setProjectToDelete(null)}
          primaryBtnLabel="Delete"
          secondaryBtnLabel="Cancel"
          onPrimaryBtnClick={() => handleDelete(projectToDelete)}
          onSecondaryBtnClick={() => setProjectToDelete(null)}>
          Are you sure you want to delete project &quot;
          {projectToDelete.projectInfo.name}&quot;? This action cannot be
          undone.
        </Modal>
      )}

      {/* Result Modal */}
      {showResultModal && deleteResult && (
        <Modal
          heading={deleteResult.success ? 'Success' : 'Error'}
          enableScreenOverlay={true}
          onCloseIconClick={() => setShowResultModal(false)}
          primaryBtnLabel="OK"
          onPrimaryBtnClick={() => setShowResultModal(false)}>
          {deleteResult.message}
        </Modal>
      )}
    </React.Fragment>
  );
}
export { ProjectCards };
