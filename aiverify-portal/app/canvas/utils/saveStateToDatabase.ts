import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { patchProject } from '@/lib/fetchApis/getProjects';
import { saveStateToSessionStorage } from './sessionStorage';
import { transformStateToProjectInput } from './transformStateToProjectInput';

/**
 * Gets the project ID and flow from URL parameters
 */
export const getProjectIdAndFlowFromUrl = () => {
  if (typeof window === 'undefined') return { projectId: null, flow: null };
  const params = new URLSearchParams(window.location.search);
  return {
    projectId: params.get('projectId'),
    flow: params.get('flow'),
  };
};

/**
 * Saves the current state of the page design to storage
 * Currently uses localStorage as a placeholder
 *
 * @param state The current state of the pagesDesignReducer
 */
export const saveStateToDatabase = async (state: State) => {
  console.log('saving state to database', state);
  // Save to session storage first
  saveStateToSessionStorage(state);

  // Try to save to localStorage as backup
  try {
    localStorage.setItem('pagesDesignState', JSON.stringify(state));
    console.log('Saved state to localStorage:', {
      layouts: state.layouts.map((l) =>
        l.map((item) => ({ i: item.i, w: item.w, h: item.h }))
      ),
      pathname: window.location.pathname,
    });
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }

  const { projectId } = getProjectIdAndFlowFromUrl();

  // Check if we're in a template flow by checking if the URL contains /templates/
  const isTemplateFlow = window.location.pathname.includes('/templates/');

  // If we're in a template flow or no project ID, don't try to save to database
  if (isTemplateFlow || !projectId) {
    console.log(
      'Template flow or no project ID detected, skipping database save',
      {
        isTemplateFlow,
        projectId,
        pathname: window.location.pathname,
      }
    );
    return;
  }

  try {
    // Transform state to project input format
    const data = transformStateToProjectInput(state);
    const result = await patchProject(projectId, data);

    if ('message' in result) {
      throw new Error(result.message);
    }

    console.log('Successfully saved state to database');
  } catch (error) {
    console.error('Failed to save state to database:', error);
  }
};

// Debounce the save function to prevent too many saves during rapid state changes
let saveTimeout: NodeJS.Timeout;
export const debouncedSaveStateToDatabase = (state: State) => {
  // Save to session storage first
  saveStateToSessionStorage(state);

  // Try to save to localStorage as backup
  try {
    localStorage.setItem('pagesDesignState', JSON.stringify(state));
    console.log('Saved state to localStorage (debounced):', {
      layouts: state.layouts.map((l) =>
        l.map((item) => ({ i: item.i, w: item.w, h: item.h }))
      ),
      pathname: window.location.pathname,
    });
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }

  const { projectId } = getProjectIdAndFlowFromUrl();

  // Check if we're in a template flow by checking if the URL contains /templates/
  const isTemplateFlow = window.location.pathname.includes('/templates/');

  // Don't even start the debounce timer if we're in a template flow or no project ID
  if (isTemplateFlow || !projectId) {
    console.log(
      'Template flow or no project ID detected, skipping debounced save',
      {
        isTemplateFlow,
        projectId,
        pathname: window.location.pathname,
      }
    );
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => saveStateToDatabase(state), 1000);
};
