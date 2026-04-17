'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from '@/app/providers/session-provider';
import type { AbstractIntlMessages } from 'next-intl';
import './globals.css';

interface ProvidersProps {
    locale: string;
    messages: AbstractIntlMessages;
    children: React.ReactNode;
}

export function Providers({ locale, messages, children }: ProvidersProps) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SessionProvider>
                    {children}
                </SessionProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}