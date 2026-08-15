'use client';

import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

interface Practitioner {
  id: string;
  users: { name: string } | null;
}

interface FacilitatorFilterProps {
  practitioners: Practitioner[];
  currentValue?: string;
  basePath?: string;
}

export function FacilitatorFilter({ practitioners, currentValue, basePath = '/dashboard/feedback' }: FacilitatorFilterProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`${basePath}?practitionerId=${encodeURIComponent(value)}`);
    } else {
      router.push(basePath);
    }
  }

  return (
    <div className="relative flex items-center">
      <Filter className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
      <select
        defaultValue={currentValue ?? ''}
        onChange={handleChange}
        className="h-9 rounded-md border border-input bg-background pl-8 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer text-foreground"
      >
        <option value="">All Facilitators</option>
        {practitioners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.users?.name ?? 'Unknown'}
          </option>
        ))}
      </select>
    </div>
  );
}
