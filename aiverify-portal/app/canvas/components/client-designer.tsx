'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ParsedTestResults } from '@/app/canvas/types';
import { PluginForGridLayout } from '@/app/canvas/types';
import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';
import { TemplateOutput } from '@/app/canvas/utils/transformTemplateOutputToState';
import { TestModel } from '@/app/models/utils/types';
import { InputBlockData } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { State } from './hooks/pagesDesignReducer';

// Dynamically import the Designer component with SSR disabled to prevent hydration issues
const Designer = dynamic(() => import('./designer').then(mod => mod.Designer), {
  ssr: false,
  loading: () => <div className="flex h-screen w-full items-center justify-center">Loading designer...</div>
});

type DesignerProps = {
  flow: UserFlows;
  project: ProjectOutput | TemplateOutput;
  initialState: State;
  allPluginsWithMdx: PluginForGridLayout[];
  allTestResultsOnSystem: ParsedTestResults[];
  allInputBlockDatasOnSystem: InputBlockData[];
  selectedTestResultsFromUrlParams: ParsedTestResults[];
  selectedInputBlockDatasFromUrlParams: InputBlockData[];
  pageNavigationMode: "multi" | "single";
  disabled: boolean;
  isTemplate: boolean;
  modelData?: TestModel | null;
};

export function ClientDesigner(props: DesignerProps) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading designer...</div>}>
      <Designer {...props} />
    </Suspense>
  );
} 