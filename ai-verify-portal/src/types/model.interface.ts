export enum ModelMode {
  API,
  Upload,
}

export enum AlgorithmType {
  Linear,
  Tree,
  Others,
}

export enum ModelType {
  Classification = 'Classification',
  Regression = 'Regression',
}

/**
 * Represents the model file.
 */
export default interface ModelFile {
  id?: string;
  filename: string;
  name: string; // defaults to filename when upload
  filePath: string; // should be stored relative to data upload folder
  ctime: string; // file create time
  description?: string;
  status: string;
  size: string;
  modelType?: ModelType;
  serializer: string;
  modelFormat: string;
  errorMessages: string;
  type: string;
}

/**
 * Represents the AI Model
 */
// export interface Model {
//     id?: string, // unique ID
//     name: string,
//     description: string,
//     mode: ModelMode,
//     algorithmType?: AlgorithmType,
//     modelType?: ModelType,
// }

//ModelApi interface?
