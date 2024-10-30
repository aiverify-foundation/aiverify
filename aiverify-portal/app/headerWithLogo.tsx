import { PropsWithChildren } from 'react';
import Image from 'next/image';

type HeaderProps = {
  className?: string;
};

const HeaderWithLogo = ({
  className,
  children,
}: PropsWithChildren<HeaderProps>) => {
  return (
    <header className={className}>
      <div className="flex w-full items-center justify-between">
        <Image
          src="/aiverify-logo-white.svg"
          alt="AI Verify"
          width={345}
          height={46}
        />
        {children}
      </div>
    </header>
  );
};

export { HeaderWithLogo };
