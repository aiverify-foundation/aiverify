import { HeaderWithLogo } from '@/app/headerWithLogo';
import { Icon, IconName } from '@/lib/components/IconSVG';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen w-screen bg-gradient-to-b from-primary-950 to-secondary-700 pb-16 text-white antialiased">
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}

