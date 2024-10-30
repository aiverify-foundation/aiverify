import Image from 'next/image';
import { PropsWithChildren } from 'react';

type HeaderProps = {
  className?: string;
};

const HeaderWithLogo = ({
  className,
  children,
}: PropsWithChildren<HeaderProps>) => {
  return (
    <header className={className}>
      <div className="mx-auto flex w-full items-center justify-between px-4 sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
        <Image
          src="/aiverify-logo-white.svg"
          alt="AI Verify"
          width={250}
          height={40}
        />
        {children}
      </div>
    </header>
  );
};

export { HeaderWithLogo };
