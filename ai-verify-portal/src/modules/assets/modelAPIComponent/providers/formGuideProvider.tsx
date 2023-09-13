import produce from 'immer';
import { createContext, useContext, useEffect, useState } from 'react';
import { Tab } from '../tabButtons';

type FormGuideProviderProps = { children: React.ReactNode };
type HighlightedInputField = {
  tabName?: Tab;
  fieldName: string;
};

const FormGuideContext = createContext<
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
      selectGuideStep: (stepName: string) => void;
      clearSelectedGuideStep: () => void;
      selectedGuideStep: string | undefined;
      highlightInputFields: (names: string[]) => void;
      highlightedFields: Record<string, true>;
      clearHighlightedFields: () => void;
      selectTab: (tab: Tab) => void;
      clearSelectedTab: () => void;
      highlightedTab: Tab | undefined;
      reset: () => void;
    }
  | undefined
>(undefined);

function FormGuideProvider({ children }: FormGuideProviderProps) {
  const [inputFieldsDisabledStatus, setInputFieldsDisabledStatus] = useState<
    Record<string, boolean>
  >({});
  const [guideStepToFieldMap, setGuideStepToFieldMap] = useState<
    Record<string, HighlightedInputField[]>
  >({});
  const [selectedGuideStep, setSelectedGuideStep] = useState<
    string | undefined
  >();
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

  function selectGuideStep(stepName: string) {
    setSelectedGuideStep(stepName);
  }

  function clearSelectedGuideStep() {
    setSelectedGuideStep(undefined);
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

  function selectTab(tab: Tab) {
    setHighlightedTab(tab);
  }

  function clearSelectedTab() {
    setHighlightedTab(undefined);
  }

  function reset() {
    setInputFieldsDisabledStatus({});
    setGuideStepToFieldMap({});
  }

  useEffect(() => {
    console.log(highlightedFields);
  }, [highlightedFields]);

  const contextValue = {
    inputFieldsDisabledStatus,
    guideStepToFieldMap,
    disableInputField,
    enableInputField,
    addGuideStep,
    removeGuideStep,
    selectGuideStep,
    clearSelectedGuideStep,
    selectedGuideStep,
    highlightInputFields,
    clearHighlightedFields,
    highlightedFields,
    selectTab,
    clearSelectedTab,
    highlightedTab,
    reset,
  };

  return (
    <FormGuideContext.Provider value={contextValue}>
      {children}
    </FormGuideContext.Provider>
  );
}

function useFormGuide() {
  const context = useContext(FormGuideContext);
  if (context === undefined) {
    throw new Error('useFormGuide must be used within a FormGuideProvider');
  }
  return context;
}

export { FormGuideProvider, useFormGuide };
