import { createContext } from 'react';

export function getComponents() {
  return {};
}

export function parseRJSFSchema() {
  return {
    sensitive_feature: {
      items: {},
    },
  };
}

export type InputDataContextType = {
  meta: any;
  data: any;
  onChangeData?: (key: string, value: any) => void;
};

export const InputDataContext = createContext<InputDataContextType>({
  meta: {},
  data: {},
});
