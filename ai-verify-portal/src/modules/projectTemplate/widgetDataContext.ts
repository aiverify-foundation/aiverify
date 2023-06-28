import { createContext } from 'react';

export type WidgetDataContextType = {
  [key: string]: {
    properties: any;
  };
};

const WidgetDataContext = createContext<WidgetDataContextType>({});
export default WidgetDataContext;
