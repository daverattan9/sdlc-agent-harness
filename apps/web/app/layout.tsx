import type { Metadata } from 'next';
import { Bebas_Neue, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mission Control — Analytics',
  description: 'Real-time business analytics dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
