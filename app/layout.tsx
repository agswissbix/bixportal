import './globals.css';
import { AppProvider } from '@/context/appContext';

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
        </AppProvider>
      </body>
    </html>
  );
}