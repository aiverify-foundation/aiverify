import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { getProjectIdAndFlowFromUrl } from './saveStateToDatabase';

const SESSION_STORAGE_KEY = 'canvasState';

/**
 * Saves a reference to the last saved state in session storage
 * @param state The current state of the pagesDesignReducer
 */
export const saveStateToSessionStorage = (state: State) => {
  try {
    const { projectId } = getProjectIdAndFlowFromUrl();
    if (!projectId) return;

    // Only store minimal reference data
    const referenceData = {
      projectId,
      timestamp: Date.now(),
      pageCount: state.layouts.length,
      lastModified: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(referenceData));
  } catch (error) {
    console.error('Failed to save state reference to session storage:', error);
  }
};

/**
 * Checks if there is a valid state reference in session storage for the current project
 * @returns The stored state reference or null if not found
 */
export const getStateFromSessionStorage = (): null => {
  // Always return null since we no longer store the actual state here
  return null;
};

/**
 * Clears the canvas state reference from session storage
 */
export const clearSessionStorage = () => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
};

/**
 * Checks if there is a valid state reference in session storage for the current project
 */
export const hasValidSessionStorage = (): boolean => {
  try {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!data) return false;

    const { projectId, timestamp } = JSON.parse(data);
    const { projectId: currentProjectId } = getProjectIdAndFlowFromUrl();

    if (projectId !== currentProjectId) return false;

    // Check if reference is less than 24 hours old
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < ONE_DAY;
  } catch {
    return false;
  }
};
