export interface DatasetColumn {
  name: string; // column name
  datatype: string;
  label: string; // pretty name
}

export enum DatasetType {
  File,
  Folder,
}

/**
 * Represents the data file.
 */
export default interface Dataset {
  id?: string;
  filename: string;
  name: string; // defaults to filename when upload
  type: DatasetType;
  filePath: string; // should be stored relative to data upload folder
  ctime: string; // file create time
  dataColumns: DatasetColumn[];
  numRows: number; // number of data rows
  numCols: number; // number of data columns
  description?: string;
  //status: DatasetStatus,
  status: string; // 👈 Todo - change to DatasetStatusType enum
  size: string;
  serializer: string;
  dataFormat: string;
  errorMessages: string;
}

export enum AssetValidationStatus {
  Pending = 'Pending',
  Valid = 'Valid',
  Invalid = 'Invalid',
  Error = 'Error',
  Cancelled = 'Cancelled',
}

export type DatasetStatusUpdate = Pick<
  Dataset,
  'filename' | 'status' | 'errorMessages'
> & { status: AssetValidationStatus };
export type ModelStatusUpdate = Pick<
  Dataset,
  'filename' | 'status' | 'errorMessages'
> & { status: AssetValidationStatus };
