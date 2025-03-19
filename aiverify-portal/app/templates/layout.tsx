import React from 'react';
import { ReactNode } from 'react';
import TemplatesHeader from './components/templatesHeader';

type LayoutProps = {
  children: ReactNode;
};

const TemplatesLayout = ({ children }: LayoutProps) => {
  return (
    <div>
      <TemplatesHeader />
      <main className="mx-auto px-4 pt-[64px] sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        {children}
      </main>
    </div>
  );
};

export default TemplatesLayout;
