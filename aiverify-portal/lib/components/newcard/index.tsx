// Tremor Card [v0.0.2]

import { Slot } from '@radix-ui/react-slot';
import React from 'react';

import { cn } from '@/lib/utils/twmerge';

interface NewCardProps extends React.ComponentPropsWithoutRef<'div'> {
  asChild?: boolean;
}

const NewCard = React.forwardRef<HTMLDivElement, NewCardProps>(
  ({ className, asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'div';
    return (
      <Component
        ref={forwardedRef}
        className={cn(
          // base
          'relative w-full rounded-lg border p-6 text-left shadow-sm',
          // background color
          'bg-white dark:bg-[#090E1A]',
          // border color
          'border-gray-200 dark:border-gray-900',
          className
        )}
        tremor-id="tremor-raw"
        {...props}
      />
    );
  }
);

NewCard.displayName = 'NewCard';

export { NewCard, type NewCardProps };
