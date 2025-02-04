// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'My Next.js App',
  description: 'Frontend per autenticazione Django',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
