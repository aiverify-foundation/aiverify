export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  model: string;
  status: string;
};

export type ReqResponse<T> = {
  status: number;
  success: boolean;
  data?: T;
};
