import { debounce } from 'lodash';
import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';

/**
 * Saves the current state of the page design to storage
 * Currently uses localStorage as a placeholder
 *
 * @param state The current state of the pagesDesignReducer
 */
const saveStateToDatabase = (state: State) => {
  // Store in localStorage for now
  try {
    localStorage.setItem('pageDesignState', JSON.stringify(state));
    console.log('State saved to localStorage');
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }

  // TODO: Replace with actual API call
  // The API call should:
  // 1. Send the state to the backend
  // 2. Handle authentication/authorization
  // 3. Implement proper error handling and retry logic
  // 4. Consider optimizing by only sending changed parts of the state

  // TODO: Further improvements:
  // - Reduce the amount of data sent to the backend
  // - Use IDs of objects instead of the objects themselves, then when receiving the state, replace the IDs with the actual objects
  // - Send only the changed parts of the state
  // - Send the state in a more efficient format (e.g., JSON)
  // - Handle pagination if the state is too large to send in one go
  // - Add proper error handling and retry logic
  // - Implement proper logging
};

/**
 * Debounced version of saveStateToDatabase to prevent excessive saves
 * during rapid state changes
 */
export const debouncedSaveStateToDatabase = debounce(saveStateToDatabase, 1000);

export default saveStateToDatabase;
