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
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}