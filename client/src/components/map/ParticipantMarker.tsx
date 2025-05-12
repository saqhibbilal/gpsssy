import { useEffect, useRef } from "react";
import L from "leaflet";
import { ParticipantWithTracking } from "@shared/schema";

interface ParticipantMarkerProps {
  map: L.Map;
  participant: ParticipantWithTracking;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ParticipantMarker({ 
  map, 
  participant, 
  isSelected = false,
  onClick
}: ParticipantMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  const latestPosition = participant.latestPosition?.location as any;
  const hasAlert = participant.latestPosition?.hasAlert || false;
  const alertType = participant.latestPosition?.alertType;
  
  useEffect(() => {
    if (map && latestPosition) {
      // Remove existing marker if it exists
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Create HTML for the custom marker
      const markerHtml = `
        <div class="flex flex-col items-center">
          <div class="relative">
            <div class="w-8 h-8 rounded-full ${hasAlert ? 'bg-destructive animate-pulse' : 'bg-primary'} 
                        flex items-center justify-center text-white border-2 border-white">
              ${participant.number}
            </div>
            <span class="status-indicator ${
              hasAlert ? 'status-alert' :
              participant.status === 'active' ? 'status-active' : 'status-warning'
            } absolute -top-1 -right-1"></span>
          </div>
          <div class="map-overlay mt-1 px-2 py-0.5 text-xs ${hasAlert ? 'bg-destructive bg-opacity-70' : ''}">
            ${participant.name.split(' ')[0]}
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
      const marker = L.marker([latestPosition.lat, latestPosition.lng], { icon })
        .addTo(map)
        .on('click', () => {
          onClick?.();
          // Open popup when marker is clicked
          if (popupRef.current) {
            marker.openPopup(popupRef.current);
          }
        });

      // Create popup with participant info
      const popup = L.popup({
        closeButton: true,
        autoClose: false,
        className: 'bg-card text-foreground'
      })
        .setLatLng([latestPosition.lat, latestPosition.lng])
        .setContent(`
          <div class="p-2">
            <h3 class="font-bold">${participant.name}</h3>
            <p>Bib #${participant.number}</p>
            <p>Distance: ${participant.distance?.toFixed(1) || 0} km</p>
            <p>Time: ${participant.duration || '00:00:00'}</p>
            ${hasAlert ? `<p class="text-destructive font-bold">ALERT: ${alertType}</p>` : ''}
          </div>
        `);

      // Open popup if marker is selected
      if (isSelected) {
        marker.openPopup(popup);
      }

      markerRef.current = marker;
      popupRef.current = popup;

      // Clean up on unmount
      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
      };
    }
  }, [map, participant, latestPosition, hasAlert, alertType, isSelected, onClick]);

  // Hide component in the React tree as we're using Leaflet for rendering
  return null;
}
