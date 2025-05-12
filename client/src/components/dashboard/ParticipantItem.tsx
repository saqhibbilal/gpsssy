import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantWithTracking } from "@shared/schema";

interface ParticipantItemProps {
  participant: ParticipantWithTracking;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ParticipantItem({ 
  participant, 
  isSelected = false,
  onClick 
}: ParticipantItemProps) {
  const hasAlert = participant.latestPosition?.hasAlert || false;
  const alertType = participant.latestPosition?.alertType;
  
  // Determine status indicator and text
  let statusIndicator = "status-active";
  let statusText = "On Track";
  
  if (hasAlert) {
    statusIndicator = "status-alert";
    statusText = "Emergency";
  } else if (participant.status === 'withdrawn') {
    statusIndicator = "status-warning";
    statusText = "Withdrawn";
  } else if (participant.latestPosition?.speed && participant.latestPosition.speed < 1) {
    statusIndicator = "status-warning";
    statusText = "Stopped";
  }
  
  return (
    <div 
      className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer
                 ${isSelected ? 'bg-muted' : ''} 
                 ${hasAlert ? 'bg-destructive bg-opacity-10' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center mr-3">
            <span className="text-sm">{participant.number}</span>
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-medium">{participant.name}</span>
              <span className={`status-indicator ${statusIndicator} ml-2`}></span>
            </div>
            <div className="text-sm text-muted-foreground">
              {hasAlert && <span className="text-destructive">{alertType} • </span>}
              <span className="font-mono">{participant.distance?.toFixed(1) || 0} km</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-medium ${hasAlert ? 'text-destructive' : statusText === 'Stopped' ? 'text-accent' : 'text-secondary'}`}>
            {statusText}
          </div>
          <div className="font-mono text-xs text-muted-foreground">{participant.duration || '00:00:00'}</div>
        </div>
      </div>
      
      {/* Additional buttons for participants with alerts */}
      {hasAlert && (
        <div className="flex justify-between mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3 py-1 bg-background text-destructive border-destructive flex items-center"
          >
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3 py-1 bg-background text-foreground"
          >
            Show on Map
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3 py-1 bg-background text-foreground"
          >
            Details
          </Button>
        </div>
      )}
    </div>
  );
}
