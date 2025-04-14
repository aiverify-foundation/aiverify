import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';

interface LayoutHeaderProps {
  projectId?: string | null;
  onBack?: () => void;
}

const LayoutHeader: React.FC<LayoutHeaderProps> = ({ projectId, onBack }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isProjectFlow = !!projectId;
  console.log('isProjectFlow:', isProjectFlow);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-primary-700 bg-primary-950 px-6 backdrop-blur-sm">
      {/* Left Navigation */}
      <div className="flex items-center">
        {isProjectFlow ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-primary-300">
            <Icon
              name={IconName.ArrowLeft}
              size={30}
              color="currentColor"
            />
            <span className="text-lg font-semibold text-white">
              Back to Project
            </span>
          </button>
        ) : (
          <>
            <div
              className="relative ml-6 flex cursor-pointer items-center"
              onClick={toggleMenu}>
              <Icon
                name={IconName.BurgerMenu}
                svgClassName="fill-white dark:fill-white"
              />
            </div>
          </>
        )}
      </div>

      {/* Menu Dropdown */}
      {!isProjectFlow && isMenuOpen && (
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

export default LayoutHeader;
