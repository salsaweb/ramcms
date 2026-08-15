'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/events';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, MapPin, Image as ImageIcon, Tag, Users } from 'lucide-react';

export function EventForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createEvent(formData);

    if (result.success && result.event) {
      router.push(`/${locale}/dashboard/events/${result.event.id}`);
    } else {
      setError(result.error || 'Failed to submit event');
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          Create Community Event
        </CardTitle>
        <CardDescription>
          Host a workshop, retreat, or class specifically for the Janzu community.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
             <div>
                <Label htmlFor="title" className="text-base font-semibold">Event Title *</Label>
                <Input id="title" name="title" required placeholder="e.g. Tulum Water Dance Retreat" className="mt-1" />
             </div>

             <div>
                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                <Textarea 
                   id="description" 
                   name="description" 
                   rows={4}
                   placeholder="Describe what participants will learn or experience..." 
                   className="mt-1" 
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                   <Label htmlFor="type" className="text-base font-semibold flex items-center gap-2 mt-4">
                     <Tag className="h-4 w-4 text-slate-500" /> Event Type *
                   </Label>
                   <select 
                      id="type" 
                      name="type" 
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
                   >
                     <option value="workshop">Workshop</option>
                     <option value="retreat">Retreat</option>
                     <option value="class">Class</option>
                     <option value="other">Other Gathering</option>
                   </select>
                </div>
                <div>
                   <Label htmlFor="max_attendees" className="text-base font-semibold flex items-center gap-2 mt-4">
                     <Users className="h-4 w-4 text-slate-500" /> Max Attendees
                   </Label>
                   <Input id="max_attendees" name="max_attendees" type="number" min="1" placeholder="e.g. 20" className="mt-1" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <Label htmlFor="start_date" className="text-base font-semibold">Start Date & Time *</Label>
                   <Input id="start_date" name="start_date" type="datetime-local" required className="mt-1" />
                </div>
                <div>
                   <Label htmlFor="end_date" className="text-base font-semibold">End Date & Time *</Label>
                   <Input id="end_date" name="end_date" type="datetime-local" required className="mt-1" />
                </div>
             </div>

             <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-slate-500"/> Location Details</h3>
                <div className="grid grid-cols-1 gap-4">
                   <div>
                     <Label htmlFor="address">Address / Venue Name</Label>
                     <Input id="address" name="address" placeholder="e.g. Grand Cenote, Highway 109" />
                     <p className="text-xs text-muted-foreground mt-1">If this event maps to a verified directory spot, you can enter the ID later.</p>
                   </div>
                </div>
             </div>

             <div className="border-t pt-4">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-slate-500"/> Media & Value</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <Label htmlFor="price_guide">Price / Fee</Label>
                       <Input id="price_guide" name="price_guide" placeholder="e.g. $150 USD, Free, Donation..." className="mt-1" />
                    </div>
                    <div>
                       <Label htmlFor="image_url">Cover Image URL</Label>
                       <Input id="image_url" name="image_url" type="url" placeholder="https://..." className="mt-1" />
                    </div>
                 </div>
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
           <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" disabled={loading} className="px-8">
             {loading ? 'Publishing...' : 'Publish Event'}
           </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
