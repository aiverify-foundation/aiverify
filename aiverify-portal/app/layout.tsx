import { Icon, IconName } from '@/lib/components/IconSVG';
import './globals.css';
import { HeaderWithLogo } from '@/app/headerWithLogo';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-auto w-screen bg-gradient-to-b from-primary-950 to-secondary-700 pb-16 text-white antialiased">
        <HeaderWithLogo className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center px-6">
          <div className="flex items-center gap-6">
            <Icon
              name={IconName.Bell}
              svgClassName="fill-white dark:fill-white"
            />
          </div>
        </HeaderWithLogo>
        <main className="mx-auto px-4 pt-[64px] sm:px-6 lg:max-w-[1520px] lg:px-8 xl:max-w-[1720px] xl:px-12">
          {children}
        </main>
      </body>
    </html>
  );
}
