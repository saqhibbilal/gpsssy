import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TrackingMap from "@/components/map/TrackingMap";
import ParticipantsList from "@/components/dashboard/ParticipantsList";
import EventStatistics from "@/components/dashboard/EventStatistics";
import { Event } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface LiveTrackingProps {
  eventId: number;
}

export default function LiveTracking({ eventId }: LiveTrackingProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | undefined>(undefined);
  
  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden p-2 gap-2 bg-background/50">
      {/* Map Section */}
      <Card className="relative flex-1 md:w-2/3 overflow-hidden border border-border/40 shadow-md">
        {event && (
          <TrackingMap 
            eventId={eventId}
            eventName={event.name}
            selectedParticipantId={selectedParticipantId}
            onParticipantSelect={setSelectedParticipantId}
          />
        )}
      </Card>

      {/* Dashboard Section */}
      <Card className="md:w-1/3 lg:w-1/3 bg-card/70 backdrop-blur-sm overflow-hidden flex flex-col shadow-md">
        <ParticipantsList 
          eventId={eventId}
          onParticipantSelect={setSelectedParticipantId}
          selectedParticipantId={selectedParticipantId}
        />
        <EventStatistics eventId={eventId} />
      </Card>
    </div>
  );
}
