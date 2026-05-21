'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from '@/app/actions/map';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Fix for default Leaflet icon paths in Next.js
// Without this, the default blue marker is broken if we don't supply custom icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const createPractitionerIcon = (imageUrl?: string) => {
  const html = `
    <div style="
      background-color: #0ea5e9; 
      width: 36px; height: 36px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    ">
      ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createLocationIcon = () => {
  const html = `
    <div style="
      background-color: #10b981; 
      width: 30px; height: 30px; 
      border-radius: 6px; 
      border: 2px solid white; 
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      display: flex; align-items: center; justify-content: center;
      transform: rotate(45deg);
    ">
       <div style="transform: rotate(-45deg);">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
       </div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

export default function MapViewer({ pins }: { pins: MapPin[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl border flex items-center justify-center text-muted-foreground">Loading Map...</div>;
  }

  // Calculate center view (simple average, defaulting to a global view if empty)
  let center: [number, number] = [20, 0];
  let zoom = 2;

  if (pins.length > 0) {
     const lats = pins.map(p => p.latitude);
     const lngs = pins.map(p => p.longitude);
     center = [
       (Math.min(...lats) + Math.max(...lats)) / 2,
       (Math.min(...lngs) + Math.max(...lngs)) / 2
     ];
     zoom = pins.length === 1 ? 10 : 3;
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border shadow-sm relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {pins.map((pin) => {
          const icon = pin.type === 'practitioner' 
            ? createPractitionerIcon(pin.imageUrl)
            : createLocationIcon();

          return (
            <Marker 
              key={`${pin.type}-${pin.id}`} 
              position={[pin.latitude, pin.longitude]} 
              icon={icon}
            >
              <Popup className="rounded-xl">
                 <div className="text-center min-w-[150px]">
                    {pin.imageUrl && pin.type === 'location' && (
                       <img src={pin.imageUrl} alt={pin.title} className="w-full h-24 object-cover rounded-t-xl -mt-4 -ml-5 pr-10 mb-2" style={{width: 'calc(100% + 40px)'}} />
                    )}
                    <div className="font-semibold text-lg text-slate-800 leading-tight mb-1">{pin.title}</div>
                    
                    {pin.subtitle && (
                       <div className="text-xs text-muted-foreground mb-1">{pin.subtitle}</div>
                    )}
                    
                    {pin.category && (
                       <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mb-2">{pin.category}</div>
                    )}
                    
                    <div className="mt-3">
                       <Link 
                          href={pin.href} 
                          className="inline-block bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
                       >
                         {pin.type === 'practitioner' ? 'View Profile' : 'View Details'}
                       </Link>
                    </div>
                 </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
