import React from 'react';
import { QueryProvider } from './components/QueryProvider';

export default function RunTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="h-full w-full">{children}</div>
    </QueryProvider>
  );
}
