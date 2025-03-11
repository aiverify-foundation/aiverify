'use client';

import React, { useState } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal/modal';

type EditableHeaderProps = {
  id: number;
  name: string; // current name
  isSaving: boolean; // save status
  onSave: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function ResultsNameHeader({
  id,
  name,
  isSaving,
  onSave,
  onDelete,
}: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!editedName.trim() || editedName === name) {
      // if no change
      setIsEditing(false);
      return;
    }

    try {
      await onSave(id, editedName.trim());
      setIsEditing(false);
    } catch {
      console.log('Failed to update name.');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setShowDeleteModal(false);
    } catch {
      console.log('Failed to delete test result.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="rounded border border-primary-500 bg-secondary-800 px-2 py-1 text-white focus:outline-none"
                disabled={isSaving}
                style={{ width: '450px' }}
              />
              <button
                onClick={handleSave}
                className={`rounded px-2 py-1 ${isSaving ? 'bg-gray-500' : 'bg-primary-500 hover:bg-primary-600'} text-white`}
                disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                disabled={isSaving}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{name}</h2>
              <Icon
                name={IconName.Pencil}
                size={20}
                color="var(--color-secondary-500)"
                onClick={() => setIsEditing(true)}
              />
            </>
          )}
        </div>
        <Icon
          name={IconName.Delete}
          size={20}
          color="var(--color-secondary-500)"
          onClick={handleDelete}
        />
      </div>

      {showDeleteModal && (
        <Modal
          heading="Confirm Delete"
          enableScreenOverlay={true}
          primaryBtnLabel={isDeleting ? 'Deleting...' : 'Delete'}
          secondaryBtnLabel="Cancel"
          onPrimaryBtnClick={confirmDelete}
          onSecondaryBtnClick={cancelDelete}
          onCloseIconClick={cancelDelete}
          width={500}
          height={250}>
          <p className="text-primary-100">
            Are you sure you want to delete &ldquo;{name}&rdquo;?
          </p>
        </Modal>
      )}
    </>
  );
}
