import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';

export default function SelectDataLayout({
  children,
  project,
}: {
  children: React.ReactNode;
  project: ProjectOutput;
}) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto px-4 pt-[64px] sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        {children}
      </main>
    </div>
  );
}
