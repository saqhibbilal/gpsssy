import { MapPin, Layers, Locate, Maximize, Minimize } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MapToolbarProps {
  eventName: string;
  activeLayers: {
    participants: boolean;
    checkpoints: boolean;
    route: boolean;
  };
  onLayersToggle: (layer: keyof typeof activeLayers) => void;
  onMyLocation: () => void;
  onFullscreen: () => void;
}

export default function MapToolbar({
  eventName,
  activeLayers,
  onLayersToggle,
  onMyLocation,
  onFullscreen
}: MapToolbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update fullscreen state when it changes
  document.addEventListener('fullscreenchange', () => {
    setIsFullscreen(!!document.fullscreenElement);
  });

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
      <div className="map-overlay px-4 py-2">
        <div className="flex items-center">
          <span className="text-primary font-medium">{eventName}</span>
          <div className="flex items-center ml-3 px-2 py-0.5 bg-card rounded-full">
            <span className="status-indicator status-active mr-1"></span>
            <span className="text-xs">LIVE</span>
          </div>
        </div>
      </div>
      
      <div className="map-overlay flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Layers className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={activeLayers.participants}
              onCheckedChange={() => onLayersToggle('participants')}
            >
              Participants
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={activeLayers.checkpoints}
              onCheckedChange={() => onLayersToggle('checkpoints')}
            >
              Checkpoints
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={activeLayers.route}
              onCheckedChange={() => onLayersToggle('route')}
            >
              Route
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={onMyLocation}>
          <Locate className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={onFullscreen}>
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
