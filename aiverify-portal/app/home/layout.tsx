import React from 'react';
import { ReactNode } from 'react';
import Image from 'next/image';
import { Icon, IconName } from '@/lib/components/IconSVG';
import '../globals.css';

type LayoutProps = {
  children: ReactNode;
};

const HomeLayout = ({ children }: LayoutProps) => {
  return (
    <div>
      <header className="bg-primary-950/100 fixed top-0 left-0 right-0 z-50 flex h-16 items-center px-6 border-b border-primary-700 backdrop-blur-sm">
        <div className="flex items-center justify-center flex-grow">
            <div className="text-center">
            <Image
                src="/aiverify-logo-white.svg"
                alt="AI Verify"
                width={250} height={40}
            />
            </div>
        </div>

        {/* Right: Bell Icon */}
        <div className="flex items-center">
          <Icon
            name={IconName.Bell}
            svgClassName="fill-white dark:fill-white"
          />
        </div>
      </header>
        <main className="mx-auto px-4 pt-[64px] sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
          {children}
        </main>
    </div>
  );
};

export default HomeLayout;