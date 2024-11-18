import { createContext } from 'react';

export type InputDataContextType = {
  meta: any; // widget meta
  data: any; // input block data
  onChangeData?: (key: string, value: any) => void; // to be called whenever data is changed
}

export const InputDataContext = createContext<InputDataContextType>({
  meta: {},
  data: {},
});