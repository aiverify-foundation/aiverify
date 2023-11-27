import produce from 'immer';
import { createContext, useContext, useState } from 'react';
import { Tab } from '../tabButtons';

type FormGuideProviderProps = { children: React.ReactNode };
type HighlightedInputField = {
  tabName?: Tab;
  fieldName: string;
};

const PresetHelpContext = createContext<
  | {
      inputFieldsDisabledStatus: Record<string, boolean>;
      guideStepToFieldMap: Record<string, HighlightedInputField[]>;
      disableInputField: (fieldName: string) => void;
      enableInputField: (fieldName: string) => void;
      addGuideStep: (
        stepName: string,
        inputFields: HighlightedInputField[]
      ) => void;
      removeGuideStep: (stepName: string) => void;
      highlightInputFields: (names: string[]) => void;
      highlightedFields: Record<string, true>;
      clearHighlightedFields: () => void;
      selectTab: (tab: Tab | undefined) => void;
      clearSelectedTab: () => void;
      highlightedTab: Tab | undefined;
      reset: () => void;
    }
  | undefined
>(undefined);

function PresetHelperProvider({ children }: FormGuideProviderProps) {
  const [inputFieldsDisabledStatus, setInputFieldsDisabledStatus] = useState<
    Record<string, boolean>
  >({});
  const [guideStepToFieldMap, setGuideStepToFieldMap] = useState<
    Record<string, HighlightedInputField[]>
  >({});
  const [highlightedFields, setHighlightedFields] = useState<
    Record<string, true>
  >({});
  const [highlightedTab, setHighlightedTab] = useState<Tab | undefined>();

  function disableInputField(fieldName: string) {
    setInputFieldsDisabledStatus(
      produce((draft) => {
        draft[fieldName] = true;
      })
    );
  }

  function enableInputField(fieldName: string) {
    setInputFieldsDisabledStatus(
      produce((draft) => {
        draft[fieldName] = false;
      })
    );
  }

  function addGuideStep(
    stepName: string,
    inputFields: HighlightedInputField[]
  ) {
    setGuideStepToFieldMap(
      produce((draft) => {
        draft[stepName] = [...inputFields];
      })
    );
  }

  function removeGuideStep(stepName: string) {
    setGuideStepToFieldMap(
      produce((draft) => {
        delete draft[stepName];
      })
    );
  }

  function highlightInputFields(names: string[]) {
    setHighlightedFields(
      produce((draft) => {
        names.forEach((name) => (draft[name] = true));
      })
    );
  }

  function clearHighlightedFields() {
    setHighlightedFields({});
  }

  function selectTab(tab: Tab | undefined) {
    setHighlightedTab(tab);
  }

  function clearSelectedTab() {
    setHighlightedTab(undefined);
  }

  function reset() {
    setInputFieldsDisabledStatus({});
    setGuideStepToFieldMap({});
  }

  const contextValue = {
    inputFieldsDisabledStatus,
    guideStepToFieldMap,
    disableInputField,
    enableInputField,
    addGuideStep,
    removeGuideStep,
    highlightInputFields,
    clearHighlightedFields,
    highlightedFields,
    selectTab,
    clearSelectedTab,
    highlightedTab,
    reset,
  };

  return (
    <PresetHelpContext.Provider value={contextValue}>
      {children}
    </PresetHelpContext.Provider>
  );
}

function usePresetHelper() {
  const context = useContext(PresetHelpContext);
  if (context === undefined) {
    throw new Error(
      'usePresetHelper must be used within a PresetHelperProvider'
    );
  }
  return context;
}

export { PresetHelperProvider, usePresetHelper };
