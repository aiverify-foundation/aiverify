'use client';
import { Card } from '@/lib/components/card/card';

export function ProjectCardsLoading({ className }: { className?: string }) {
  return (
    <section className={className} data-testid="project-cards-loading">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          size="md"
          width={450}
          className="text-shadow-sm !bg-none text-white [&&]:bg-secondary-900">
          <Card.Content className="flex flex-col gap-7 p-4">
            <div className="h-7 w-48 animate-pulse rounded-md bg-secondary-600" />
            <div className="h-20 w-full animate-pulse rounded-md bg-secondary-600" />
          </Card.Content>
        </Card>
      ))}
    </section>
  );
}
