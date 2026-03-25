import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { SessionProvider } from '@/app/providers/session-provider';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Janzu Portal',
  description: 'Janzu Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}