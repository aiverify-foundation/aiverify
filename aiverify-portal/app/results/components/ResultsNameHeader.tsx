'use client';

import React, { useState } from 'react';
import { Icon, IconName } from "@/lib/components/IconSVG";

type EditableHeaderProps = {
  id: number; // ID of the result to update
  name: string; // Current name to display or edit
  isSaving: boolean; // Tracks the save process
  onSave: (id: number, newName: string) => Promise<void>; // Server action to handle saving
};

export function ResultsNameHeader({ id, name, isSaving, onSave }: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!editedName.trim() || editedName === name) {
      setIsEditing(false); // No changes made
      return;
    }

    try {
      await onSave(id, editedName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating result name:', error);
      alert('Failed to update the result name. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditedName(name); // Revert to original name
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
        {isEditing ? (
            <>
            <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-secondary-800 text-white px-2 py-1 rounded focus:outline-none border border-primary-500"
                disabled={isSaving}
                style={{ width: '600px' }}
            />
            <button
                onClick={handleSave}
                className={`px-2 py-1 rounded ${
                isSaving ? 'bg-gray-500' : 'bg-primary-500 hover:bg-primary-600'
                } text-white`}
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                disabled={isSaving}
            >
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
                onClick={handleEdit}
            />
            </>
        )}
        </div>
        <div>
            <Icon
                name={IconName.Close}
                size={20}
                color="var(--color-secondary-500)"
            />
        </div>
    </div>
  );
}
