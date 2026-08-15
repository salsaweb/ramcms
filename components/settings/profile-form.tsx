'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateMyProfile } from '@/app/actions/profile';

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
  };
  participant: {
    phone?: string;
    linkedin_url?: string;
    twitter_handle?: string;
    facebook_url?: string;
    custom_fields?: Record<string, any>;
  } | null;
  practitioner?: {
    bio?: string;
    website?: string;
    location_name?: string;
    phone?: string;
    social_links?: Record<string, string>;
  } | null;
}

export function ProfileForm({ user, participant, practitioner }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasSocials = !!(participant || practitioner);
  const defaultPhone = participant?.phone || practitioner?.phone || '';
  const defaultInstagram = participant?.custom_fields?.instagram || practitioner?.social_links?.instagram || '';
  const defaultTwitter = participant?.twitter_handle || practitioner?.social_links?.twitter_handle || '';
  const defaultFacebook = participant?.facebook_url || practitioner?.social_links?.facebook_url || '';
  const defaultYoutube = participant?.custom_fields?.youtube || practitioner?.social_links?.youtube || '';
  const defaultLinkedin = participant?.linkedin_url || practitioner?.social_links?.linkedin_url || '';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await updateMyProfile(formData);

    if (result.success) {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.error || 'Failed to update profile');
    }
    setLoading(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
        <CardDescription>
          Update your platform identity and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={user.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={user.email}
              />
            </div>

            {hasSocials && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">Contact & Social Networks</h3>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={defaultPhone}
                    placeholder="+1 (555) 000-0000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your direct phone contact for the Janzu platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Username</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      defaultValue={defaultInstagram}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterHandle">X (Twitter) Handle</Label>
                    <Input
                      id="twitterHandle"
                      name="twitterHandle"
                      defaultValue={defaultTwitter}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input
                      id="facebookUrl"
                      name="facebookUrl"
                      type="url"
                      defaultValue={defaultFacebook}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube URL</Label>
                    <Input
                      id="youtube"
                      name="youtube"
                      type="url"
                      defaultValue={defaultYoutube}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      name="linkedinUrl"
                      type="url"
                      defaultValue={defaultLinkedin}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              </div>
            )}

            {practitioner && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">Practitioner Profile</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    defaultValue={practitioner.bio || ''}
                    placeholder="Tell us about your practice..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      defaultValue={practitioner.website || ''}
                      placeholder="https://mywebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationName">Primary Location Name</Label>
                    <Input
                      id="locationName"
                      name="locationName"
                      defaultValue={practitioner.location_name || ''}
                      placeholder="e.g. Zen Pool Retreat"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
