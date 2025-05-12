import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ParticipantWithTracking, Checkpoint, Route, AlertInfo } from "@shared/schema";
import { calculateBounds, geoJsonToPoints } from "@/lib/maps";
import { useQuery } from "@tanstack/react-query";
import MapToolbar from "./MapToolbar";
import ParticipantMarker from "./ParticipantMarker";
import CheckpointMarker from "./Checkpoint";
import EmergencyAlert from "./EmergencyAlert";

interface TrackingMapProps {
  eventId: number;
  eventName: string;
  selectedParticipantId?: number;
  onParticipantSelect?: (participantId: number) => void;
}

export default function TrackingMap({
  eventId,
  eventName,
  selectedParticipantId,
  onParticipantSelect
}: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    participants: true,
    checkpoints: true,
    route: true
  });

  // Fetch route data for the event
  const { data: routes } = useQuery<Route[]>({
    queryKey: [`/api/events/${eventId}/route`],
    enabled: !!eventId,
  });

  // Fetch checkpoints for the route
  const { data: checkpoints } = useQuery<Checkpoint[]>({
    queryKey: [`/api/routes/${routes?.[0]?.id}/checkpoints`],
    enabled: !!routes?.[0]?.id,
  });

  // Fetch participant tracking data
  const { data: participants } = useQuery<ParticipantWithTracking[]>({
    queryKey: [`/api/events/${eventId}/participants/tracking`],
    enabled: !!eventId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch active alerts
  const { data: alerts } = useQuery<AlertInfo[]>({
    queryKey: [`/api/events/${eventId}/alerts`],
    enabled: !!eventId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize Leaflet map
      const leafletMap = L.map(mapContainerRef.current, {
        center: [37.7749, -122.4194], // Default center (San Francisco)
        zoom: 13,
        zoomControl: false, // We'll add custom controls
        attributionControl: true
      });

      // Add dark theme tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);

      // Add zoom control to the top right
      L.control.zoom({
        position: 'topright'
      }).addTo(leafletMap);

      mapRef.current = leafletMap;
      setMap(leafletMap);

      // Clean up on unmount
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  // Add route to map
  useEffect(() => {
    if (map && routes && routes.length > 0 && activeLayers.route) {
      const route = routes[0];
      
      // Clear existing route layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });

      try {
        // Convert GeoJSON route to points
        const routePoints = geoJsonToPoints(route.path);
        
        if (routePoints.length > 0) {
          // Create polyline from points
          const routeLine = L.polyline(
            routePoints.map(point => [point.lat, point.lng]),
            {
              color: '#1E88E5',
              weight: 5,
              opacity: 0.7,
              dashArray: '10, 10',
              lineCap: 'round'
            }
          ).addTo(map);

          // Fit map to route bounds
          const bounds = calculateBounds(routePoints);
          map.fitBounds([
            [bounds.south, bounds.west],
            [bounds.north, bounds.east]
          ]);
        }
      } catch (error) {
        console.error('Error rendering route:', error);
      }
    }
  }, [map, routes, activeLayers.route]);

  // Handle participant focus
  useEffect(() => {
    if (map && participants && selectedParticipantId) {
      const participant = participants.find(p => p.id === selectedParticipantId);
      if (participant && participant.latestPosition) {
        const location = participant.latestPosition.location as any;
        map.setView([location.lat, location.lng], 15);
      }
    }
  }, [map, participants, selectedParticipantId]);

  // Handle layer toggle
  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Handle my location button
  const goToMyLocation = () => {
    if (map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView(
            [position.coords.latitude, position.coords.longitude],
            15
          );
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (mapContainerRef.current) {
      if (!document.fullscreenElement) {
        mapContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative flex-1 h-full">
      <div ref={mapContainerRef} className="map-container w-full h-full">
        {/* Map will be rendered here */}
      </div>

      {/* Map Toolbar */}
      <MapToolbar 
        eventName={eventName}
        onLayersToggle={toggleLayer}
        onMyLocation={goToMyLocation}
        onFullscreen={toggleFullscreen}
        activeLayers={activeLayers}
      />

      {/* Render participants on map */}
      {map && participants && activeLayers.participants && (
        participants.map(participant => (
          <ParticipantMarker 
            key={participant.id}
            map={map}
            participant={participant}
            isSelected={participant.id === selectedParticipantId}
            onClick={() => onParticipantSelect?.(participant.id)}
          />
        ))
      )}

      {/* Render checkpoints on map */}
      {map && checkpoints && activeLayers.checkpoints && (
        checkpoints.map(checkpoint => (
          <CheckpointMarker 
            key={checkpoint.id}
            map={map}
            checkpoint={checkpoint}
          />
        ))
      )}

      {/* Render emergency alerts */}
      {map && alerts && alerts.length > 0 && (
        <EmergencyAlert 
          alert={alerts[0]} 
          onRespond={() => {
            // Focus on the participant with the alert
            if (onParticipantSelect) {
              onParticipantSelect(alerts[0].participantId);
            }
          }}
        />
      )}
    </div>
  );
}
