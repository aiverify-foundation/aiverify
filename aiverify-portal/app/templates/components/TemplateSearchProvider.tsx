'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ReportTemplate } from '../types';

interface TemplateSearchContextType {
  filteredTemplates: ReportTemplate[];
  onSearch: (templates: ReportTemplate[]) => void;
}

const TemplateSearchContext = createContext<TemplateSearchContextType | undefined>(undefined);

interface TemplateSearchProviderProps {
  children: ReactNode;
  initialTemplates: ReportTemplate[];
}

export function TemplateSearchProvider({ children, initialTemplates }: TemplateSearchProviderProps) {
  const [filteredTemplates, setFilteredTemplates] = useState<ReportTemplate[]>(initialTemplates);

  const onSearch = (templates: ReportTemplate[]) => {
    setFilteredTemplates(templates);
  };

  return (
    <TemplateSearchContext.Provider value={{ filteredTemplates, onSearch }}>
      {children}
    </TemplateSearchContext.Provider>
  );
}

export function useTemplateSearch() {
  const context = useContext(TemplateSearchContext);
  if (context === undefined) {
    throw new Error('useTemplateSearch must be used within a TemplateSearchProvider');
  }
  return context;
} 