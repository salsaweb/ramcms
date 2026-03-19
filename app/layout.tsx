import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { SessionProvider } from '@/app/providers/session-provider';
import './globals.css';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Enterprise CMS',
  description: 'Production-ready CMS with RBAC authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}