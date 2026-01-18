import type { Metadata } from 'next';
import './globals.css';
import UIScaleProvider from '@/components/common/UIScaleProvider';

export const metadata: Metadata = {
  title: 'A.P.E.X. V3 | Mission Control',
  description: 'Bloomberg Terminal for RC Racing',
  viewport: 'width=device-width, initial-scale=1, user-scalable=yes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />
      </head>
      <body className="bg-apex-dark text-white font-inter antialiased">
        <UIScaleProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </UIScaleProvider>
      </body>
    </html>
  );
}
