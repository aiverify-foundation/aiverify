'use client';

import { UserFlows } from '@/app/userFlowsEnum';
import { TemplateCards } from './templateCards';
import { useTemplateSearch } from './TemplateSearchProvider';

interface FilteredTemplateCardsProps {
  projectId?: string;
  flow?: UserFlows;
}

export function FilteredTemplateCards({ projectId, flow }: FilteredTemplateCardsProps) {
  const { filteredTemplates } = useTemplateSearch();

  return (
    <TemplateCards
      templates={filteredTemplates}
      projectId={projectId}
      flow={flow}
    />
  );
} 