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
  // Save minimal reference to session storage
  saveStateToSessionStorage(state);

  // Try to save minimal state to localStorage as backup
  try {
    // Get only non-overflow pages
    const nonOverflowPages = state.layouts
      .map((layout, index) => ({ layout, index }))
      .filter(({ index }) => state.pageTypes[index] !== 'overflow')
      .map(({ layout, index }) => ({
        layouts: layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })),
        widgets: state.widgets[index],
        isOverflowPage: false,
        pageIndex: index,
      }));

    const minimalState = {
      timestamp: Date.now(),
      projectId: getProjectIdAndFlowFromUrl().projectId,
      layouts: nonOverflowPages.map((p) => p.layouts),
      pageTypes: state.pageTypes.filter((type) => type !== 'overflow'),
      overflowParents: state.overflowParents.filter(
        (_, idx) => state.pageTypes[idx] !== 'overflow'
      ),
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(
      'pagesDesignState_minimal',
      JSON.stringify(minimalState)
    );
    console.log('Saved minimal state to localStorage');
  } catch (error) {
    console.warn('Failed to save minimal state to localStorage:', error);
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
    // Transform state to project input format - this will filter out overflow pages
    const data = transformStateToProjectInput(state, {
      filterOverflowPages: true,
    });
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
  // Save minimal reference to session storage
  saveStateToSessionStorage(state);

  // Try to save minimal state to localStorage as backup
  try {
    // Get only non-overflow pages
    const nonOverflowPages = state.layouts
      .map((layout, index) => ({ layout, index }))
      .filter(({ index }) => state.pageTypes[index] !== 'overflow')
      .map(({ layout, index }) => ({
        layouts: layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })),
        pageIndex: index,
      }));

    const minimalState = {
      timestamp: Date.now(),
      projectId: getProjectIdAndFlowFromUrl().projectId,
      layouts: nonOverflowPages.map((p) => p.layouts),
      pageTypes: state.pageTypes.filter((type) => type !== 'overflow'),
      overflowParents: state.overflowParents.filter(
        (_, idx) => state.pageTypes[idx] !== 'overflow'
      ),
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(
      'pagesDesignState_minimal',
      JSON.stringify(minimalState)
    );
    console.log('Saved minimal state to localStorage (debounced)');
  } catch (error) {
    console.warn('Failed to save minimal state to localStorage:', error);
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
