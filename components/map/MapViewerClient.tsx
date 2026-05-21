// components/map/MapViewerClient.tsx
"use client";

import dynamic from "next/dynamic";

const MapViewer = dynamic(() => import("./MapViewer"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-xl border flex items-center justify-center text-muted-foreground shadow-inner">
            Loading Global Map Interface...
        </div>
    ),
});

export default function MapViewerClient(props: any) {
    return <MapViewer {...props} />;
}