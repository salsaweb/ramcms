'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLocation } from '@/app/actions/locations';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Droplets, ThermometerSun, DollarSign } from 'lucide-react';

export function LocationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    // Parse the image URL into a JSON string array if it exists
    const imageString = formData.get('imageUrl') as string;
    if (imageString) {
       formData.set('imageUrls', JSON.stringify([imageString]));
    }

    const result = await createLocation(formData);

    if (result.success && result.location) {
      router.push(`/dashboard/locations/${result.location.id}`);
    } else {
      setError(result.error || 'Failed to submit location');
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Add Waiter Space
        </CardTitle>
        <CardDescription>
          Help expand the Janzu community directory by submitting a new warm water location.
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
                <Label htmlFor="name" className="text-base font-semibold">Location Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Grand Cenote" className="mt-1" />
             </div>

             <div>
                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                <Textarea 
                   id="description" 
                   name="description" 
                   rows={3}
                   placeholder="A brief description of the atmosphere, depth, and accessibility..." 
                   className="mt-1" 
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                   <Label htmlFor="type" className="text-base font-semibold flex items-center gap-2">
                     <Droplets className="h-4 w-4" />
                     Water Type *
                   </Label>
                   <select 
                      id="type" 
                      name="type" 
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
                   >
                     <option value="pool">Swimming Pool</option>
                     <option value="sea">Open Ocean / Sea</option>
                     <option value="cenote">Cenote</option>
                     <option value="river">River</option>
                     <option value="lake">Lake</option>
                     <option value="other">Other</option>
                   </select>
                </div>
                <div>
                   <Label htmlFor="waterTemperature" className="text-base font-semibold flex items-center gap-2">
                     <ThermometerSun className="h-4 w-4" />
                     Avg. Temperature
                   </Label>
                   <Input id="waterTemperature" name="waterTemperature" placeholder="e.g. 34°C / 93°F" className="mt-1" />
                </div>
             </div>

             <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                     <Label htmlFor="address">Street Address</Label>
                     <Input id="address" name="address" placeholder="Av. Kukulkan Km 10" />
                   </div>
                   <div>
                     <Label htmlFor="city">City</Label>
                     <Input id="city" name="city" placeholder="Tulum" />
                   </div>
                   <div>
                     <Label htmlFor="country">Country</Label>
                     <Input id="country" name="country" placeholder="Mexico" />
                   </div>
                </div>
             </div>

             <div className="border-t pt-4">
                 <h3 className="text-lg font-semibold mb-4 pr-2">Additional Information</h3>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <Label htmlFor="priceGuide" className="flex items-center gap-2">
                         <DollarSign className="h-4 w-4" />
                         Price / Fee Guide
                       </Label>
                       <Input id="priceGuide" name="priceGuide" placeholder="e.g. $20/hr, Free for guests..." className="mt-1" />
                    </div>
                    <div>
                       <Label htmlFor="imageUrl">Cover Photo URL</Label>
                       <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." className="mt-1" />
                       <p className="text-xs text-muted-foreground mt-1">Provide a working image URL to be displayed on the directory card.</p>
                    </div>
                 </div>
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
           <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" disabled={loading} className="px-8">
             {loading ? 'Submitting...' : 'Submit Location'}
           </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
