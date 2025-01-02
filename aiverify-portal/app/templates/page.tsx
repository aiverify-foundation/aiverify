import { Suspense } from 'react';
import { TemplateCardsContainer } from './components/templateCardsContainer';
import { TemplateCardsLoading } from './components/templateCardsLoading';
import { TemplateFilters } from './components/templateFilters';
import { Button, ButtonVariant } from '@/lib/components/button';

function TemplatesPage() {
  return (
    <main className="h-screen w-full px-6">
      <h1 className="mb-0 mt-6 text-2xl font-bold tracking-wide">
        Select A Report Template
      </h1>
      <p className="mb-[80px] text-secondary-300">
        Select a template or start with an empty canvas.
      </p>
      <TemplateFilters />
      <Suspense
        fallback={<TemplateCardsLoading className="flex flex-wrap gap-6" />}>
        <TemplateCardsContainer className="mt-6 flex flex-wrap gap-6" />
        <div className="mt-[80px] flex justify-end">
          <Button
            type="submit"
            text="Next"
            variant={ButtonVariant.PRIMARY}
            size="sm"
          />
        </div>
      </Suspense>
    </main>
  );
}

export default TemplatesPage;
