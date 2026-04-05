import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Janzu Portal',
  description: 'Janzu Portal',
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
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}