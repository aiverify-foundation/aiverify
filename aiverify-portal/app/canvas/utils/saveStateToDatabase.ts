import { useUpdateProject, patchProject } from '@/lib/fetchApis/getProjects';
import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';

/**
 * Gets the project ID and flow from URL parameters
 */
const getProjectIdAndFlowFromUrl = () => {
  if (typeof window === 'undefined') return { projectId: null, flow: null };
  const params = new URLSearchParams(window.location.search);
  return {
    projectId: params.get('projectId'),
    flow: params.get('flow')
  };
};

/**
 * Transforms the state into the format expected by the API
 */
const transformStateForApi = (state: State) => {
  // Extract test results and input blocks from the maps
  const testResults = Object.values(state.gridItemToAlgosMap)
    .flat()
    .filter(item => item.testResultId !== undefined)
    .map(item => item.testResultId);

  const inputBlocks = Object.values(state.gridItemToInputBlockDatasMap)
    .flat()
    .filter(item => item.inputBlockDataId !== undefined)
    .map(item => item.inputBlockDataId);

  // Create pages array from layouts and widgets
  const pages = state.layouts.map((layout: any, index: number) => ({
    layouts: layout.map((item: any) => ({
      ...item,
      static: false, // Add the missing `static` field with a default value
    })),
    widgets: state.widgets[index] || [],
    reportWidgets: [], // Required by schema
    pageType: state.pageTypes[index] || 'grid',
    overflowParent: state.overflowParents[index]
  }));

  // Return data matching ProjectPatchInput schema
  return {
    pages,
    globalVars: [], // Required by ProjectTemplateMetaOptional
    testResults: testResults.length > 0 ? testResults : undefined, // Optional field
    inputBlocks: inputBlocks.length > 0 ? inputBlocks : undefined, // Optional field
    projectInfo: undefined, // Optional field
    testModelId: undefined // Optional field
  };
};

/**
 * Saves the current state of the page design to storage
 * Currently uses localStorage as a placeholder
 *
 * @param state The current state of the pagesDesignReducer
 */
export const saveStateToDatabase = async (state: State) => {
  // Always save to localStorage as it's needed for the designer
  try {
    localStorage.setItem('pagesDesignState', JSON.stringify(state));
    console.log('Saved state to localStorage:', {
      layouts: state.layouts.map(l => l.map(item => ({ i: item.i, w: item.w, h: item.h }))),
      pathname: window.location.pathname
    });
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }

  const { projectId, flow } = getProjectIdAndFlowFromUrl();
  
  // Check if we're in a template flow by checking if the URL contains /templates/
  const isTemplateFlow = window.location.pathname.includes('/templates/');
  
  // If we're in a template flow or no project ID, don't try to save to database
  if (isTemplateFlow || !projectId) {
    console.log('Template flow or no project ID detected, skipping database save', {
      isTemplateFlow,
      projectId,
      pathname: window.location.pathname
    });
    return;
  }

  try {
    const data = transformStateForApi(state);
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
  // Always save to localStorage immediately
  try {
    localStorage.setItem('pagesDesignState', JSON.stringify(state));
    console.log('Saved state to localStorage (debounced):', {
      layouts: state.layouts.map(l => l.map(item => ({ i: item.i, w: item.w, h: item.h }))),
      pathname: window.location.pathname
    });
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }

  const { projectId, flow } = getProjectIdAndFlowFromUrl();
  
  // Check if we're in a template flow by checking if the URL contains /templates/
  const isTemplateFlow = window.location.pathname.includes('/templates/');
  
  // Don't even start the debounce timer if we're in a template flow or no project ID
  if (isTemplateFlow || !projectId) {
    console.log('Template flow or no project ID detected, skipping debounced save', {
      isTemplateFlow,
      projectId,
      pathname: window.location.pathname
    });
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => saveStateToDatabase(state), 1000);
};
