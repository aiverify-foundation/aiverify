import { Icon, IconName } from '@/lib/components/IconSVG';
import './globals.css';
import { HeaderWithLogo } from '@/app/home/components/headerWithLogo';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-gradient-to-b from-primary-950 to-secondary-700 text-white antialiased">
        <HeaderWithLogo className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center px-6">
          <div className="flex items-center gap-6">
            <Icon
              name={IconName.Bell}
              svgClassName="fill-white dark:fill-white"
            />
          </div>
        </HeaderWithLogo>
        <main className="3xl:max-w-[85vw] 4xl:max-w-[2560px] mx-auto max-w-7xl px-4 pt-[64px] sm:px-6 lg:max-w-[1400px] lg:px-8 xl:max-w-[1600px] xl:px-12 2xl:max-w-[1920px] 2xl:px-16">
          {children}
        </main>
      </body>
    </html>
  );
}
