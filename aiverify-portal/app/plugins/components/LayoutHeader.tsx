'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';

const LayoutHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-primary-700 bg-primary-950 px-6 backdrop-blur-sm"
      role="banner"
      aria-label="Main header">
      {/* Burger Icon */}
      <div
        className="relative flex cursor-pointer items-center"
        onClick={toggleMenu}
        role="button"
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}>
        <Icon
          name={IconName.BurgerMenu}
          svgClassName="fill-white dark:fill-white"
        />
      </div>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div
          className="w-50 absolute left-6 top-20 z-[100] rounded-md bg-secondary-950 p-4 text-white shadow-lg"
          role="menu"
          aria-label="Navigation menu">
          <ul role="menu">
            <li
              className="border-b border-secondary-300 py-2"
              role="menuitem">
              <Link
                href="/home"
                className="block hover:text-secondary-300"
                aria-label="Navigate to Home">
                Home
              </Link>
            </li>
            <li
              className="border-b border-secondary-300 py-2"
              role="menuitem">
              <Link
                href="/models"
                className="block hover:text-secondary-300"
                aria-label="Navigate to Models">
                Model
              </Link>
            </li>
            <li
              className="border-b border-secondary-300 py-2"
              role="menuitem">
              <Link
                href="/datasets"
                className="block hover:text-secondary-300"
                aria-label="Navigate to Data">
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
            <li
              className="border-b border-secondary-300 py-2"
              role="menuitem">
              <Link
                href="/plugins"
                className="block hover:text-secondary-300"
                aria-label="Navigate to Plugins">
                Plugins
              </Link>
            </li>
            <li
              className="py-2"
              role="menuitem">
              <Link
                href="/templates"
                className="block hover:text-secondary-300"
                aria-label="Navigate to Report Templates">
                Report Templates
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Center: Logo */}
      <div className="flex flex-grow items-center justify-center">
        <Link
          href="/home"
          aria-label="Navigate to Home">
          <Image
            src="/aiverify-logo-white.svg"
            alt="AI Verify Logo"
            width={250}
            height={40}
          />
        </Link>
      </div>

      {/* Right: Bell Icon */}
      <div className="flex items-center">
        <Icon
          name={IconName.Bell}
          svgClassName="fill-white dark:fill-white"
          role="img"
          aria-label="Notification icon"
        />
      </div>
    </header>
  );
};

export default LayoutHeader;
