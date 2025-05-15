import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { ReactNode } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import '@/app/globals.css';

type LayoutProps = {
  children: ReactNode;
};

const HomeLayout = ({ children }: LayoutProps) => {
  return (
    <div>
      <header className="bg-primary-950/100 fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-primary-700 px-6 backdrop-blur-sm">
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
             <Link href="/home">
              <Image
                src="/aiverify-logo-white.svg"
                alt="AI Verify"
                width={250}
                height={40}
                />
              </Link>
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
