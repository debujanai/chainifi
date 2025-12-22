import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ResponsiveNavProvider } from '@/components/responsive-nav-context';
import { Topbar } from '@/components/topbar';
import { MobileOverlay } from '@/components/mobile-overlay';
import { RightToggle } from '@/components/right-toggle';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'ChainfiAI',
  description: 'Predict the Unseen',
  icons: {
    icon: '/logo.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <ResponsiveNavProvider>
          <Topbar />
          <MobileOverlay />
          <RightToggle />
          <div className="lg:pt-0 pt-14">{children}</div>
        </ResponsiveNavProvider>
      </body>
    </html>
  );
}
