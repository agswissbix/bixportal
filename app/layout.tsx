import './globals.css';
import { AppProvider } from '@/context/appContext';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'Swissbix',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Swissbix',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
  isolated, 
}: {
  children: React.ReactNode;
  isolated: React.ReactNode; 
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}