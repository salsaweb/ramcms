import { getMapPins } from '@/app/actions/map';
import { Card } from '@/components/ui/card';
import { Users, Droplets } from 'lucide-react';
import MapViewerClient from "@/components/map/MapViewerClient";

export default async function MapDashboardPage() {
  const result = await getMapPins();
  const pins = result.success && result.data ? result.data : [];

  const practitionerCount = pins.filter(p => p.type === 'practitioner').length;
  const locationCount = pins.filter(p => p.type === 'location').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Directory</h1>
        <p className="text-muted-foreground mt-1 text-lg max-w-2xl">
          Discover certified Janzu practitioners and approved warm water locations around the world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-sky-50 border-sky-100 flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-sky-200 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-sky-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-900">Practitioners Mapped</p>
            <p className="text-2xl font-bold text-sky-700">{practitionerCount}</p>
          </div>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
            <Droplets className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Water Spots Mapped</p>
            <p className="text-2xl font-bold text-emerald-700">{locationCount}</p>
          </div>
        </Card>
      </div>

      <MapViewerClient pins={pins} />

    </div>
  );
}
