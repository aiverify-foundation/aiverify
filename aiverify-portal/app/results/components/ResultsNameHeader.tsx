'use client';

import React, { useState } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';

type EditableHeaderProps = {
  id: number; // ID of the result to update
  name: string; // Current name
  isSaving: boolean; // Save status
  onSave: (id: number, newName: string) => Promise<void>; 
  onDelete: (id: number) => Promise<void>;
};

export function ResultsNameHeader({ id, name, isSaving, onSave, onDelete }: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleSave = async () => {
    if (!editedName.trim() || editedName === name) { // if no change
      setIsEditing(false); 
      return;
    }

    try {
      await onSave(id, editedName.trim());
      setIsEditing(false);
    } catch {
      // error handle 
    }
  };

const handleDelete = async () => {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    try {
      await onDelete(id);
    }
    catch {
      // error handle
    }
  }
}

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
              className={`px-2 py-1 rounded ${isSaving ? 'bg-gray-500' : 'bg-primary-500 hover:bg-primary-600'} text-white`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
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
  );
}
