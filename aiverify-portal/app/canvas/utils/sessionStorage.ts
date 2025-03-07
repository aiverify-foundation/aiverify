import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { getProjectIdAndFlowFromUrl } from './saveStateToDatabase';

const SESSION_STORAGE_KEY = 'canvasState';

/**
 * Saves the canvas state to session storage
 * @param state The current state of the pagesDesignReducer
 */
export const saveStateToSessionStorage = (state: State) => {
  try {
    const { projectId } = getProjectIdAndFlowFromUrl();
    if (!projectId) return;

    const storageData = {
      projectId,
      state,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save state to session storage:', error);
  }
};

/**
 * Retrieves the canvas state from session storage
 * @returns The stored state or null if not found
 */
export const getStateFromSessionStorage = (): State | null => {
  try {
    const { projectId } = getProjectIdAndFlowFromUrl();
    if (!projectId) return null;

    const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedData) return null;

    const {
      projectId: storedProjectId,
      state,
      timestamp,
    } = JSON.parse(storedData);

    // Check if the stored state belongs to the current project
    if (storedProjectId !== projectId) return null;

    // Check if the stored state is less than 24 hours old
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_DAY) {
      clearSessionStorage();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to retrieve state from session storage:', error);
    return null;
  }
};

/**
 * Clears the canvas state from session storage
 */
export const clearSessionStorage = () => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
};

/**
 * Checks if there is a valid state in session storage for the current project
 */
export const hasValidSessionStorage = (): boolean => {
  return getStateFromSessionStorage() !== null;
};
