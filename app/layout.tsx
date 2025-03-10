'use client';

import './globals.css';
import { AppContext, AppProvider } from '@/context/appContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
          {children}
      </body>
    </html>
  );
}
