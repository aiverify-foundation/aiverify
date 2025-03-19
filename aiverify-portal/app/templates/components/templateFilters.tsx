'use client';

import { IconName } from '@/lib/components/IconSVG';
import { Icon } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TextInput } from '@/lib/components/textInput';

export function TemplateFilters({ className }: { className?: string }) {
  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-[400px] gap-2">
            <TextInput
              placeholder="Search templates..."
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
      </div>
    </section>
  );
}
