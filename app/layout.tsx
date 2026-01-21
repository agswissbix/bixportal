import './globals.css';
import { AppProvider } from '@/context/appContext';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function RootLayout({
  children,
  isolated, 
}: {
  children: React.ReactNode;
  isolated: React.ReactNode; 
}) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Swissbix" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          {`
            .toastui-editor-defaultUI, 
            .toastui-editor-popup-wrapper,
            .toastui-editor-ww-popup {
              z-index: 0 !important;
            }
          `}
        </style>
      </head>
      <body>
        <AppProvider>
          {children}
          <PWAInstallPrompt />
        </AppProvider>
      </body>
    </html>
  );
}