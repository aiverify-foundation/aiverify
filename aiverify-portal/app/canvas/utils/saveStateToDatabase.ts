import { useUpdateProject, patchProject } from '@/lib/fetchApis/getProjects';
import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';

/**
 * Gets the project ID from URL parameters
 */
const getProjectIdFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('projectId');
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
  // Save to localStorage as fallback
  localStorage.setItem('pagesDesignState', JSON.stringify(state));

  const projectId = getProjectIdFromUrl();
  if (!projectId) {
    console.error('No project ID found in URL parameters');
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
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => saveStateToDatabase(state), 1000);
};
