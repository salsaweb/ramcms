'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createPractitioner, updatePractitioner } from '@/app/actions/practitioners';

interface PractitionerFormProps {
  initialData?: any;
  availableUsers?: any[];
  isEdit?: boolean;
}

export function PractitionerForm({ initialData, availableUsers, isEdit }: PractitionerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    let data: any = {
      bio: formData.get('bio') as string,
      website: formData.get('website') as string,
      locationName: formData.get('locationName') as string,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
      phone: formData.get('phone') as string,
      instagram: formData.get('instagram') as string,
      twitterHandle: formData.get('twitterHandle') as string,
      facebookUrl: formData.get('facebookUrl') as string,
      youtube: formData.get('youtube') as string,
      linkedinUrl: formData.get('linkedinUrl') as string,
      status: formData.get('status') as any,
    };

    if (!isEdit) {
      if (isNewUser) {
        data.newUser = {
          name: formData.get('newUserName') as string,
          email: formData.get('newUserEmail') as string,
        };
      } else {
        data.userId = formData.get('userId') as string;
      }
    }

    try {
      let result;
      if (isEdit) {
        result = await updatePractitioner({ id: initialData?.id, ...data });
      } else {
        result = await createPractitioner(data);
      }

      if (result.success) {
        router.push('/dashboard/practitioners');
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {!isEdit && availableUsers && (
            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant={!isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(false)}
                >
                  Link Existing User
                </Button>
                <Button 
                  type="button" 
                  variant={isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(true)}
                >
                  Create New User
                </Button>
              </div>

              {!isNewUser ? (
                <div className="space-y-2">
                  <Label htmlFor="userId">Select Existing User *</Label>
                  <select
                    id="userId"
                    name="userId"
                    required={!isNewUser}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUserName">New User Name *</Label>
                    <Input 
                      id="newUserName" 
                      name="newUserName" 
                      required={isNewUser} 
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">New User Email *</Label>
                    <Input 
                      id="newUserEmail" 
                      name="newUserEmail" 
                      type="email"
                      required={isNewUser} 
                      placeholder="jane@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      An invite will be automatically sent to this email.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              defaultValue={initialData?.bio || ''} 
              rows={4} 
              placeholder="Practitioner's background and experience..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input 
                id="website" 
                name="website" 
                type="url" 
                defaultValue={initialData?.website || ''} 
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                defaultValue={initialData?.phone || ''} 
                placeholder="+1 555-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input 
                id="locationName" 
                name="locationName" 
                defaultValue={initialData?.location_name || ''} 
                placeholder="e.g. Tulum, MX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input 
                id="latitude" 
                name="latitude" 
                type="number" 
                step="any"
                defaultValue={initialData?.latitude || ''} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input 
                id="longitude" 
                name="longitude" 
                type="number" 
                step="any"
                defaultValue={initialData?.longitude || ''} 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Social Networks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram Username</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  defaultValue={initialData?.social_links?.instagram || ''}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterHandle">X (Twitter) Handle</Label>
                <Input
                  id="twitterHandle"
                  name="twitterHandle"
                  defaultValue={initialData?.social_links?.twitter_handle || ''}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  defaultValue={initialData?.social_links?.facebook_url || ''}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  name="youtube"
                  type="url"
                  defaultValue={initialData?.social_links?.youtube || ''}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  defaultValue={initialData?.social_links?.linkedin_url || ''}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={initialData?.status || 'pending'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="button" variant="outline" className="mr-2" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Practitioner'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
