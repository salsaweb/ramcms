'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shell, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/app/actions/auth';
import { useLocale } from 'next-intl';

type Step = 'set-password' | 'complete-profile';

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = params.get('token') || '';

  const [step, setStep] = useState<Step>('set-password');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(formData, token);
      if (!result.success) {
        setError(result.error || 'Failed to set password. The link may have expired.');
      } else {
        setStep('complete-profile');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Left Side */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shell className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Janzu Portal</h1>
          </div>

          {/* Step 1: Set Password */}
          {step === 'set-password' && (
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Accept your invitation</CardTitle>
                <CardDescription>
                  Set a password to activate your account.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSetPassword}>
                <CardContent className="space-y-4">
                  {!token && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                      Invalid or missing invite link. Please ask an administrator to resend the invitation.
                    </div>
                  )}
                  {error && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                      disabled={isLoading || !token}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min. 8 characters, with uppercase, lowercase, number and special character.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      disabled={isLoading || !token}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? 'Setting password...' : 'Set Password & Continue'}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Step 2: Complete Profile Prompt */}
          {step === 'complete-profile' && (
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Password set successfully!</span>
                </div>
                <CardTitle className="text-2xl font-bold">Welcome to Janzu Portal 👋</CardTitle>
                <CardDescription>
                  Would you like to complete your profile now? You can always do this later from your settings.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/${locale}/dashboard/settings/profile`)}
                >
                  Complete My Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/dashboard`)}
                >
                  Skip for now → Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
