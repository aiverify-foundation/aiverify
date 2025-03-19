import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { FairnessTree, FairnessTreeData } from '@/app/inputs/utils/types';
import { isApiError, toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse, ApiResult } from '@/lib/utils/http-requests';
import { parseFastAPIError } from '@/lib/utils/parseFastAPIError';

interface UseFairnessTreeEditProps {
  tree: FairnessTree;
  onClose: () => void;
}

interface TreeUpdates {
  name: string;
  group: string;
  data: FairnessTreeData;
}

export const useFairnessTreeEdit = ({ tree }: UseFairnessTreeEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [treeName, setTreeName] = useState(tree.name);
  const [hasChanges, setHasChanges] = useState(false);
  const [treeData, setTreeData] = useState<FairnessTreeData>(
    tree.data || {
      graphdata: { nodes: [], edges: [] },
      definitions: [],
      selectedOutcomes: [],
      metrics: [],
    }
  );
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>(
    tree.data?.selectedOutcomes || []
  );
  const [metrics, setMetrics] = useState<string[]>(tree.data?.metrics || []);

  const handleChangeData = (key: string, value: string[]) => {
    if (key === 'selectedOutcomes') {
      setSelectedOutcomes(value);
      setTreeData((prevData) => ({
        ...prevData,
        selectedOutcomes: value,
      }));

      const updatedTreeData: FairnessTreeData = {
        ...treeData,
        selectedOutcomes: value,
      };
      Object.keys(updatedTreeData).forEach((key) => {
        if (
          key.startsWith('ans-') &&
          !value.includes(key.replace('ans-', ''))
        ) {
          delete updatedTreeData[key];
        }
      });

      setTreeData(updatedTreeData);
    } else if (key === 'metrics') {
      console.log('new metrics:', value);
      setMetrics(value);
      setTreeData((prevData) => ({
        ...prevData,
        metrics: value,
      }));
    } else {
      setTreeData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const mutation = useMutation({
    mutationFn: async (updatedData: Partial<TreeUpdates>) => {
      console.log('submitted data:', updatedData);
      const response = await fetch(`/api/input_block_data/${tree.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          group: updatedData.name,
          data: updatedData.data,
        }),
      });

      const result = await processResponse(response);

      if (isApiError(result)) {
        throw parseFastAPIError(result.data);
      }

      if ('message' in result) {
        throw toErrorWithMessage(result);
      }

      return result as ApiResult<TreeUpdates>;
    },
  });

  useEffect(() => {
    const hasTreeDataChanges =
      JSON.stringify(treeData) !== JSON.stringify(tree.data) ||
      treeName !== tree.name;

    setHasChanges(hasTreeDataChanges);
  }, [treeData, treeName, tree.data, tree.name]);

  const handleSaveChanges = async () => {
    try {
      const updates: Partial<TreeUpdates> = {
        name: treeName,
        data: {
          ...treeData,
          selectedOutcomes,
          metrics,
        },
      };

      await mutation.mutateAsync(updates);
      setIsEditing(false);
      return { success: true, message: 'Tree updated successfully' };
    } catch (error) {
      console.error('Failed to save changes:', error);
      return { success: false, message: `Error updating tree: ${error}` };
    }
  };

  return {
    isEditing,
    setIsEditing,
    treeName,
    setTreeName,
    hasChanges,
    treeData,
    selectedOutcomes,
    metrics,
    mutation,
    handleChangeData,
    handleSaveChanges,
  };
};
