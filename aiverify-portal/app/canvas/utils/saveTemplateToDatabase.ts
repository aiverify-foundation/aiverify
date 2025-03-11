import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';
import { patchTemplate } from '@/lib/fetchApis/getTemplates';
import { saveStateToSessionStorage } from './sessionStorage';
import { transformStateToTemplateInput } from './transformStateToTemplateInput';

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
 * Saves the current state of the template design to storage
 * Currently uses localStorage as a placeholder
 *
 * @param state The current state of the pagesDesignReducer
 */
export const saveTemplateToDatabase = async (state: State) => {
  console.log('saving template state to database', state);
  // Save minimal reference to session storage
  saveStateToSessionStorage(state);

  // Try to save minimal state to localStorage as backup
  try {
    const minimalState = {
      timestamp: Date.now(),
      templateId: getTemplateIdFromUrl().templateId,
      layouts: state.layouts.map((layout) =>
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

  const { templateId } = getTemplateIdFromUrl();

  // Check if we're in a project flow by checking if the URL contains /projects/
  const isProjectFlow = window.location.pathname.includes('/projects/');

  // If we're in a project flow or no template ID, don't try to save to database
  if (isProjectFlow || !templateId) {
    console.log(
      'Project flow or no template ID detected, skipping database save',
      {
        isProjectFlow,
        templateId,
        pathname: window.location.pathname,
      }
    );
    return;
  }

  try {
    // Transform state to template input format
    const data = transformStateToTemplateInput(state);
    console.log('template sent to patch', data);
    const result = await patchTemplate(templateId, data);

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
    const minimalState = {
      timestamp: Date.now(),
      templateId: getTemplateIdFromUrl().templateId,
      layouts: state.layouts.map((layout) =>
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

  const { templateId } = getTemplateIdFromUrl();

  // Check if we're in a project flow by checking if the URL contains /projects/
  const isProjectFlow = window.location.pathname.includes('/projects/');

  // Don't even start the debounce timer if we're in a project flow or no template ID
  if (isProjectFlow || !templateId) {
    console.log(
      'Project flow or no template ID detected, skipping debounced save',
      {
        isProjectFlow,
        templateId,
        pathname: window.location.pathname,
      }
    );
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => saveTemplateToDatabase(state), 1000);
};
