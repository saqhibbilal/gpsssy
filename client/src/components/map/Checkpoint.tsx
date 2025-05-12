import { useEffect, useRef } from "react";
import L from "leaflet";
import { Checkpoint } from "@shared/schema";

interface CheckpointMarkerProps {
  map: L.Map;
  checkpoint: Checkpoint;
}

export default function CheckpointMarker({ map, checkpoint }: CheckpointMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (map && checkpoint && checkpoint.location) {
      // Remove existing marker and circle if they exist
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (circleRef.current) {
        circleRef.current.remove();
      }

      // Get checkpoint location
      const location = checkpoint.location as any;
      const coordinates = location.coordinates || [location.lng, location.lat];
      const lat = typeof coordinates[1] === 'number' ? coordinates[1] : location.lat;
      const lng = typeof coordinates[0] === 'number' ? coordinates[0] : location.lng;

      // Create HTML for the custom marker
      const markerHtml = `
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flag">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" x2="4" y1="22" y2="15"></line>
            </svg>
          </div>
          <div class="map-overlay mt-1 px-2 py-0.5 text-xs">
            ${checkpoint.name}
          </div>
        </div>
      `;

      // Create custom icon
      const icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon })
        .addTo(map);

      // Create circle to show checkpoint radius
      const circle = L.circle([lat, lng], {
        radius: checkpoint.radius,
        color: '#FFC107',
        fillColor: '#FFC107',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(map);

      markerRef.current = marker;
      circleRef.current = circle;

      // Clean up on unmount
      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
        if (circleRef.current) {
          circleRef.current.remove();
        }
      };
    }
  }, [map, checkpoint]);

  // Hide component in the React tree as we're using Leaflet for rendering
  return null;
}
