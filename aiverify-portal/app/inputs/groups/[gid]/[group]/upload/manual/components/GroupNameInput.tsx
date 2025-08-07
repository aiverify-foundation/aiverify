import React, { useEffect } from 'react';
import { useChecklists } from '../../context/ChecklistsContext';
import { InfoIcon } from '../../utils/icons';
import { Tooltip } from './Tooltip';

export const GroupNameInput: React.FC = () => {
  const { groupName, setGroupName } = useChecklists();

  // Load stored group name from sessionStorage when the component mounts
  useEffect(() => {
    const storedGroupName = sessionStorage.getItem('groupName');
    if (storedGroupName) {
      setGroupName(storedGroupName);
    }
  }, [setGroupName]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(event.target.value);
  };

  return (
    <div className="mb-4 pl-2 pr-8">
      <label className="mb-1 flex items-center text-white">
        Group Name
        <Tooltip content="Enter a unique name for this set of process checklists">
          <InfoIcon className="ml-2 h-5 w-5 text-gray-400 hover:text-gray-200" />
        </Tooltip>
      </label>
      <input
        type="text"
        value={groupName || ''}
        onChange={handleChange}
        required
        placeholder="Enter group name"
        className="w-full rounded border border-gray-300 bg-secondary-950 p-2 text-white"
      />
    </div>
  );
};
