export enum ErrorSeverity {
  Information,
  Warning,
  Critical,
}

export default interface TestError {
  severity: ErrorSeverity;
  description: string;
  code?: string;
  category?: string;
  origin?: string;
  component?: string;
}
