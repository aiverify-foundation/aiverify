import { useState, useEffect } from 'react';
import { DEFAULT_CHECKLISTS, fetchDynamicChecklists, Checklist } from '../context/checklistConstants';

interface UseDynamicChecklistsResult {
  checklists: Checklist[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for loading checklists dynamically from API
 * Currently falls back to DEFAULT_CHECKLISTS, but can be enhanced for full dynamic loading
 * 
 * @param gid - Group ID to filter checklists
 * @param enableDynamic - Whether to attempt dynamic loading (default: false for now)
 */
export const useDynamicChecklists = (
  gid = 'aiverify.stock.process_checklist',
  enableDynamic = false
): UseDynamicChecklistsResult => {
  const [checklists, setChecklists] = useState<Checklist[]>(DEFAULT_CHECKLISTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadChecklists = async () => {
    if (!enableDynamic) {
      // Use default checklists when dynamic loading is disabled
      setChecklists(DEFAULT_CHECKLISTS);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dynamicChecklists = await fetchDynamicChecklists(gid);
      setChecklists(dynamicChecklists);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load checklists');
      setError(error);
      // Fallback to default checklists on error
      setChecklists(DEFAULT_CHECKLISTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists();
  }, [gid, enableDynamic]);

  const refetch = () => {
    loadChecklists();
  };

  return {
    checklists,
    isLoading,
    error,
    refetch,
  };
}; 