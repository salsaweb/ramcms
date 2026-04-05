'use client';

import { useEffect, useState } from 'react';
import { janzuQuotes } from '@/lib/janzuQuotes';
import { Card, CardContent } from '@/components/ui/card';

export function JanzuQuote() {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        const random = janzuQuotes[Math.floor(Math.random() * janzuQuotes.length)];
        setQuote(random);
    }, []);

    return (
        <Card className="opacity-80">
            <CardContent className="mt-5 text-center">
                <p className="text-lg md:text-xl font-light italic leading-relaxed text-muted-foreground max-w-md">
                    “{quote}”
                </p>
            </CardContent>
        </Card>
    );
}