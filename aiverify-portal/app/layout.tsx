import { Icon, IconName } from '@/components/IconSVG';
import './globals.css';
import { HeaderWithLogo } from '@/app/home/components/headerWithLogo';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-gradient-to-b from-primary-950 to-secondary-700 antialiased">
        <HeaderWithLogo className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center px-6">
          <div className="flex items-center gap-6">
            <Icon
              name={IconName.Bell}
              svgClassName="fill-white dark:fill-white"
            />
          </div>
        </HeaderWithLogo>
        <main className="h-full pt-[64px]">{children}</main>
      </body>
    </html>
  );
}
