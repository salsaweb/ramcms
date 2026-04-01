import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

const messagesLoaders: Record<Locale, () => Promise<any>> = {
  en: () => import('./messages/en.json'),
  es: () => import('./messages/es.json'),
};


export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';

  if (!locale || !isValidLocale(locale)) {
    notFound();
  }
  
  const messages = (await messagesLoaders[locale]()).default;

  return {
    locale, 
    messages,
  };
});