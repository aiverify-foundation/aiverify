import React from 'react';
import { ReactNode } from 'react';
import { CanvasHeader } from './components/header';

type LayoutProps = {
  children: ReactNode;
};

const CanvasLayout = ({ children }: LayoutProps) => {
  return (
    <div className="absolute top-[0] h-[100vh] w-full">
      <CanvasHeader />
      <main className="h-full w-full pt-[64px]">{children}</main>
    </div>
  );
};

export default CanvasLayout;
