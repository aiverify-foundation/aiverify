import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { patchTemplate } from '@/lib/fetchApis/getTemplates';
import { saveStateToSessionStorage } from './sessionStorage';
import { transformStateToProjectInput } from './transformStateToProjectInput';

/**
 * Gets the template ID from URL parameters
 */
export const getTemplateIdFromUrl = () => {
  if (typeof window === 'undefined') return { templateId: null };
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get('templateId');
  return {
    templateId: templateId ? parseInt(templateId, 10) : null,
  };
};

/**
 * Extract the template ID from URL pathname
 */
export const getTemplateIdFromPathname = (pathname: string): number | null => {
  const matches = pathname.match(/\/templates\/(\d+)/);
  if (matches && matches[1]) {
    const id = parseInt(matches[1], 10);
    return isNaN(id) ? null : id;
  }
  return null;
};

/**
 * Saves the current state of the template design to storage
 *
 * @param state The current state of the pagesDesignReducer
 */
export const saveTemplateToDatabase = async (state: State) => {
  console.log('saving template state to database', state);
  // Save minimal reference to session storage
  saveStateToSessionStorage(state);

  // Try to save minimal state to localStorage as backup
  try {
    // For localStorage, filter out overflow pages
    const nonOverflowLayouts = state.layouts.filter(
      (_, idx) => state.pageTypes[idx] !== 'overflow'
    );

    const minimalState = {
      timestamp: Date.now(),
      templateId: getTemplateIdFromUrl().templateId,
      layouts: nonOverflowLayouts.map((layout) =>
        layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        }))
      ),
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(
      'templateDesignState_minimal',
      JSON.stringify(minimalState)
    );
    console.log('Saved minimal template state to localStorage');
  } catch (error) {
    console.warn(
      'Failed to save minimal template state to localStorage:',
      error
    );
  }

  // Get template ID from pathname
  const templateId = getTemplateIdFromUrl().templateId;
  if (!templateId) {
    console.log('No template ID found in URL, skipping database save');
    return;
  }

  try {
    // Create a modified state with overflow pages filtered out
    const filteredState = {
      ...state,
      layouts: state.layouts.filter(
        (_, idx) => state.pageTypes[idx] !== 'overflow'
      ),
      widgets: state.widgets.filter(
        (_, idx) => state.pageTypes[idx] !== 'overflow'
      ),
      pageTypes: state.pageTypes.filter((type) => type !== 'overflow'),
      overflowParents: state.overflowParents.filter(
        (_, idx) => state.pageTypes[idx] !== 'overflow'
      ),
    };

    // Use the filtered state to transform data
    const data = transformStateToProjectInput(filteredState);

    // Use type assertion to work around type issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await patchTemplate(templateId, data as any);

    if ('message' in result) {
      throw new Error(result.message);
    }

    console.log('Successfully saved template state to database');
  } catch (error) {
    console.error('Failed to save template state to database:', error);
  }
};

// Debounce the save function to prevent too many saves during rapid state changes
let saveTimeout: NodeJS.Timeout;
export const debouncedSaveTemplateToDatabase = (state: State) => {
  // Save minimal reference to session storage
  saveStateToSessionStorage(state);

  // Try to save minimal state to localStorage as backup
  try {
    // For localStorage, filter out overflow pages
    const nonOverflowLayouts = state.layouts.filter(
      (_, idx) => state.pageTypes[idx] !== 'overflow'
    );

    const minimalState = {
      timestamp: Date.now(),
      templateId: getTemplateIdFromUrl().templateId,
      layouts: nonOverflowLayouts.map((layout) =>
        layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        }))
      ),
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(
      'templateDesignState_minimal',
      JSON.stringify(minimalState)
    );
    console.log('Saved minimal template state to localStorage (debounced)');
  } catch (error) {
    console.warn(
      'Failed to save minimal template state to localStorage:',
      error
    );
  }

  // Get template ID from pathname
  const templateId = getTemplateIdFromUrl().templateId;
  if (!templateId) {
    console.log('No template ID found in URL, skipping debounced save');
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => saveTemplateToDatabase(state), 1000);
};
