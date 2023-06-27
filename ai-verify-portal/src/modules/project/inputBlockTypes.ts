import { InputBlock } from 'src/types/plugin.interface';

export enum WidgetStatus {
  unloaded,
  loaded,
  invalid,
}

export type InputBlockState = {
  open: boolean;
  inputBlock: InputBlock;
  mdxBundle?: any;
  status: WidgetStatus;
  summaryFn: (data: any) => string;
  progressFn: (data: any) => number;
  validateFn: (data: any) => boolean;
}

export type InputBlockStateMap = {
  [gid: string]: InputBlockState
}
