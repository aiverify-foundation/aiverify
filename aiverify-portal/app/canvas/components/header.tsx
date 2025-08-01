'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ProjectOutput } from '@/app/canvas/utils/transformProjectOutputToState';
import { TemplateOutput } from '@/app/canvas/utils/transformTemplateOutputToState';
import { Icon, IconName } from '@/lib/components/IconSVG';

type CanvasHeaderProps = {
  project?: ProjectOutput | TemplateOutput;
};

const CanvasHeader = ({ project }: CanvasHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    // Create a date object and format it for Singapore timezone
    // Don't add "Z" if the timestamp already has timezone info
    const date = new Date(timestamp.includes('Z') ? timestamp : timestamp + "Z");
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Singapore',
    });
  };

  return (
    <header data-testid="canvas-header" className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-primary-700 bg-primary-950 px-6 backdrop-blur-sm">
      {/* Burger Icon and Autosave */}
      <div className="flex items-center gap-4">
        <div
          className="relative flex cursor-pointer items-center"
          onClick={toggleMenu}>
          <Icon
            name={IconName.BurgerMenu}
            svgClassName="fill-white dark:fill-white"
          />
        </div>
        {project?.updated_at && formatTimestamp(project.updated_at) && (
          <span className="text-sm text-gray-400">
            Autosaved at {formatTimestamp(project.updated_at)}
          </span>
        )}
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

      {/* Center: Logo */}
      <div className="flex flex-grow items-center justify-center">
        <Link href="/home">
          <Image
            src="/aiverify-logo-white.svg"
            alt="AI Verify"
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
        />
      </div>
    </header>
  );
};

export { CanvasHeader };
