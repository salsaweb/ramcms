import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';

export const metadata: Metadata = {
  title: 'OBRYS CRM',
  description: 'OBRYS CRM',
};

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {

  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning className={outfit.variable}>{children}</body>
    </html>
  );
}