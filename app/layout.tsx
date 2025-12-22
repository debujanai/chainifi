import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ResponsiveNavProvider } from '@/components/responsive-nav-context';
import { Topbar } from '@/components/topbar';
import { MobileOverlay } from '@/components/mobile-overlay';
import { RightToggle } from '@/components/right-toggle';
import { Sidebar } from '@/components/sidebar';
import { PropertiesPanel } from '@/components/properties-panel';

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
          <div className="flex min-h-screen bg-[#141723] lg:pt-0 pt-14">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col">
              {children}
            </main>
            <PropertiesPanel />
          </div>
        </ResponsiveNavProvider>
      </body>
    </html>
  );
}
