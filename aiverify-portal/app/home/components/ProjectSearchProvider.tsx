'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '@/app/types';

interface ProjectSearchContextType {
  filteredProjects: Project[];
  onSearch: (projects: Project[]) => void;
}

const ProjectSearchContext = createContext<ProjectSearchContextType | undefined>(undefined);

interface ProjectSearchProviderProps {
  children: ReactNode;
  initialProjects: Project[];
}

export function ProjectSearchProvider({ children, initialProjects }: ProjectSearchProviderProps) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(initialProjects);

  const onSearch = (projects: Project[]) => {
    setFilteredProjects(projects);
  };

  return (
    <ProjectSearchContext.Provider value={{ filteredProjects, onSearch }}>
      {children}
    </ProjectSearchContext.Provider>
  );
}

export function useProjectSearch() {
  const context = useContext(ProjectSearchContext);
  if (context === undefined) {
    throw new Error('useProjectSearch must be used within a ProjectSearchProvider');
  }
  return context;
} 