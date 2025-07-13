'use client';

import { ProjectCards } from './projectCards';
import { useProjectSearch } from './ProjectSearchProvider';

export function FilteredProjectCards() {
  const { filteredProjects } = useProjectSearch();

  return <ProjectCards projects={filteredProjects} />;
} 