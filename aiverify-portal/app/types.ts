export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  model: string;
  status: string;
};

export type SuccessResponse<T> = {
  status: number;
  success: boolean;
  data?: T;
};

export type ErrorResponse = {
  status: number;
  success: boolean;
  error: string;
};

export type FastApiError = {
  detail: string;
};
