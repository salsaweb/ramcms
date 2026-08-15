'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { forgotPassword } from '@/app/actions/auth';
import { useLocale, useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('auth');
  const locale = useLocale();


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (!result.success) {
        setError(result.error || t('resetPasswordFailed'));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <img src="/logo.png" alt="OBRYS CRM" className="w-64" />
          </div>

          {/* Forget Password Card */}
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{t('resetPassword')}</CardTitle>
              <CardDescription>
                {success ? (
                  <p className="text-sm text-muted-foreground">{t('emailSent')}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('sendResetLinkDescription')}</p>
                )}
              </CardDescription>
            </CardHeader>
            {!success && (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      {t('email')}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? t('sendingResetLink') : t('sendResetLink')}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    {t('rememberedPassword')}{' '}
                    <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                      {t('backToLogin')}
                    </Link>
                  </p>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}