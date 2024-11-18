import { createContext } from 'react';

/**
 * Data to be passed to report widgets
 */
export type ReportPropertiesContextType = {
    meta: any, // widget meta
    properties: any, // widget properties
}

// export const emptyReportDataContext = {
//     meta: {},
//     properties: {},
// }

/** widget key => report context  */
export type ReportPropertiesDataContextTypeMap = {
    [key:string]: ReportDataContextType
}

export type ReportDataContextType = {
    reportData: ReportPropertiesDataContextTypeMap;
    inputBlockData?: any;
    result?: any;
}

export const ReportDataContext = createContext<ReportDataContextType>({
    reportData: {},
    inputBlockData: {},
    result: {},
});
