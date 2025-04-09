import React from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';

interface FilterButtonsProps {
  statusFilters: { id: string; label: string }[];
  activeStatusFilters: string[];
  onFilterClick: (statusId: string) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  statusFilters,
  activeStatusFilters,
  onFilterClick,
}) => {
  return (
    <div className="mt-2 flex space-x-2">
      {statusFilters.map((filter) => (
        <Button
          key={filter.id}
          text={filter.label}
          textColor="white"
          variant={
            activeStatusFilters.includes(filter.id)
              ? ButtonVariant.PRIMARY
              : ButtonVariant.OUTLINE
          }
          size="xs"
          pill={true}
          onClick={() => onFilterClick(filter.id)}
          aria-pressed={activeStatusFilters.includes(filter.id)}
          aria-label={`Filter by ${filter.label}`}
        />
      ))}
    </div>
  );
};

export default FilterButtons;
