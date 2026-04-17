import { Providers } from './providers';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let messages = {};
  try {
    messages = await getMessages({ locale });
  } catch (e) {
    console.error('getMessages failed:', e);
  }

  return (
    <Providers locale={locale} messages={messages}>
      {children}
    </Providers>
  );
}