import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertInfo } from "@shared/schema";

interface EmergencyAlertProps {
  alert: AlertInfo;
  onRespond: () => void;
}

export default function EmergencyAlert({ alert, onRespond }: EmergencyAlertProps) {
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 map-overlay p-3 flex items-center text-destructive animate-pulse-slow">
      <AlertTriangle className="mr-2 h-5 w-5" />
      <div>
        <p className="font-bold">SOS ALERT</p>
        <p className="text-sm">
          {alert.participantName} (ID: {alert.participantNumber}) triggered {alert.alertType} signal at {formatTime(alert.timestamp)}
        </p>
      </div>
      <div className="flex gap-2 ml-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-background border-destructive text-destructive hover:bg-destructive hover:text-white"
        >
          <Phone className="h-4 w-4 mr-1" />
          Call
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onRespond}
        >
          Respond
        </Button>
      </div>
    </div>
  );
}
