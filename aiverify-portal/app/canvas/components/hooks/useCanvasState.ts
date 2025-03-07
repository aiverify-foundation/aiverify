'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { getProjectIdAndFlowFromUrl } from '@/app/canvas/utils/saveStateToDatabase';
import { clearSessionStorage } from '@/app/canvas/utils/sessionStorage';
import {
  State,
  initialState as defaultInitialState,
  pagesDesignReducer,
  WidgetAction,
} from './pagesDesignReducer';
import { useAutosave } from './useAutosave';

interface CanvasState {
  state: State;
  dispatch: React.Dispatch<WidgetAction>;
  navigateToNextStep: (nextStep: string) => void;
}

export const useCanvasState = (
  initialState: State = defaultInitialState
): CanvasState => {
  const [state, dispatch] = useReducer(pagesDesignReducer, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle autosave
  useAutosave(state);

  // Sync URL params with state
  const { projectId, flow } = getProjectIdAndFlowFromUrl();
  if (projectId && flow) {
    const currentParams = new URLSearchParams(searchParams.toString());
    const shouldUpdateUrl =
      currentParams.get('projectId') !== projectId ||
      currentParams.get('flow') !== flow;

    if (shouldUpdateUrl) {
      const newParams = new URLSearchParams({
        projectId,
        flow,
      });
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }

  // Clear session storage when navigating to next step
  const navigateToNextStep = (nextStep: string) => {
    clearSessionStorage();
    router.push(nextStep);
  };

  return {
    state,
    dispatch,
    navigateToNextStep,
  };
};
