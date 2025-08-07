'use client';
import { useEffect, useRef } from 'react';
import { debouncedSaveStateToDatabase } from '@/app/canvas/utils/saveStateToDatabase';
import { State } from './pagesDesignReducer';

export const useAutosave = (state: State) => {
  const previousStateRef = useRef<State | null>(null);
  const saveAttemptsRef = useRef(0);
  const MAX_SAVE_ATTEMPTS = 3;

  useEffect(() => {
    // Skip initial save
    if (previousStateRef.current === null) {
      previousStateRef.current = state;
      return;
    }

    // Only save if state has actually changed
    if (JSON.stringify(previousStateRef.current) === JSON.stringify(state)) {
      return;
    }

    const saveState = async () => {
      try {
        // The debounced function doesn't return a Promise, so we don't await it
        debouncedSaveStateToDatabase(state);
        // Note: We don't update previousStateRef here because the debounced function
        // is asynchronous and we can't easily track when it completes
        saveAttemptsRef.current = 0; // Reset attempts on successful save
      } catch (error) {
        console.error('Failed to save state:', error);
        saveAttemptsRef.current += 1;

        if (saveAttemptsRef.current >= MAX_SAVE_ATTEMPTS) {
          // Log error for monitoring
          console.error(
            'Max save attempts reached. Please try again or contact support.'
          );
        } else {
          console.warn('Save attempt failed. Retrying...');
        }
      }
    };

    saveState();
  }, [state]);
};
