"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, IconName } from "@/lib/components/IconSVG";

const LayoutHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-primary-950 fixed top-0 left-0 right-0 z-50 flex h-16 items-center px-6 border-b border-primary-700 backdrop-blur-sm">
      {/* Burger Icon */}
      <div className="relative flex items-center cursor-pointer" onClick={toggleMenu}>
        <Icon name={IconName.BurgerMenu} svgClassName="fill-white dark:fill-white" />
      </div>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div
          className="absolute left-6 top-20 w-50 bg-secondary-950 text-white p-4 rounded-md shadow-lg z-[100]">
          <ul>
            <li className="py-2 border-b border-secondary-300">
              <Link href="/home" className="block hover:text-secondary-300">
                Home
              </Link>
            </li>
            <li className="py-2 border-b border-secondary-300">
              <Link href="/models" className="block hover:text-secondary-300">
                Model
              </Link>
            </li>
            <li className="py-2 border-b border-secondary-300">
              <Link href="/data" className="block hover:text-secondary-300">
                Data
              </Link>
            </li>
            <li className="py-2 border-b border-secondary-300">
              <Link href="/plugins" className="block hover:text-secondary-300">
                Plugins
              </Link>
            </li>
            <li className="py-2">
              <Link href="/templates" className="block hover:text-secondary-300">
                Report Templates
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Center: Logo */}
      <div className="flex items-center justify-center flex-grow">
        <Link href="/home">
          <Image src="/aiverify-logo-white.svg" alt="AI Verify" width={250} height={40} />
        </Link>
      </div>

      {/* Right: Bell Icon */}
      <div className="flex items-center">
        <Icon name={IconName.Bell} svgClassName="fill-white dark:fill-white" />
      </div>
    </header>
  );
};

export default LayoutHeader;