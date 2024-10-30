'use client';

import { IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Icon } from '@/lib/components/IconSVG';
import { TextInput } from '@/lib/components/textInput';

export function ProjectsFilters({ className }: { className?: string }) {
  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <h2 className="text-xl font-bold tracking-wide">You Projects</h2>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-[400px] gap-2">
            <TextInput
              placeholder="Search projects..."
              inputStyles={{
                paddingLeft: 40,
              }}
            />
            <Icon
              name={IconName.MagnifyGlass}
              size={20}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
              }}
              svgClassName="fill-secondary-800 dark:fill-secondary-800"
            />
          </div>
          <Button
            variant={ButtonVariant.SECONDARY}
            size="sm"
            text="Clear"
            bezel={false}
          />
        </div>
        <div className="flex items-center gap-3">
          <h4>Filter By Status</h4>
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.OUTLINE}
            size="sm"
            text="Completed"
            className="!border-white"
            hoverColor="var(--color-primary-500)"
          />
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.OUTLINE}
            size="sm"
            text="No Report Yet"
            className="!border-white"
            hoverColor="var(--color-primary-500)"
          />
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.OUTLINE}
            size="sm"
            text="Running Test"
            className="!border-white"
            hoverColor="var(--color-primary-500)"
          />
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.OUTLINE}
            size="sm"
            text="Generating PDF"
            className="!border-white"
            hoverColor="var(--color-primary-500)"
          />
        </div>
      </div>
    </section>
  );
}
