'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { ReactNode } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import '@/app/globals.css';

type LayoutProps = {
  children: ReactNode;
};

const HomeLayout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div>
      <header className="bg-primary-950/100 fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-primary-700 px-6 backdrop-blur-sm">
        {/* Burger Icon */}
        <div
          className="relative flex cursor-pointer items-center"
          onClick={toggleMenu}>
          <Icon
            name={IconName.BurgerMenu}
            svgClassName="fill-white dark:fill-white"
          />
        </div>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div className="w-50 absolute left-6 top-20 z-[100] rounded-md bg-secondary-950 p-4 text-white shadow-lg">
            <ul>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/home"
                  className="block hover:text-secondary-300">
                  Home
                </Link>
              </li>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/models"
                  className="block hover:text-secondary-300">
                  Model
                </Link>
              </li>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/datasets"
                  className="block hover:text-secondary-300">
                  Data
                </Link>
              </li>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/results"
                  className="block hover:text-secondary-300">
                  Results
                </Link>
              </li>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/inputs"
                  className="block hover:text-secondary-300">
                  Inputs
                </Link>
              </li>
              <li className="border-b border-secondary-300 py-2">
                <Link
                  href="/plugins"
                  className="block hover:text-secondary-300">
                  Plugins
                </Link>
              </li>
              <li className="py-2">
                <Link
                  href="/templates"
                  className="block hover:text-secondary-300">
                  Report Templates
                </Link>
              </li>
            </ul>
          </div>
        )}

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
