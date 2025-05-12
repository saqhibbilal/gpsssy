import { useQuery } from "@tanstack/react-query";
import { EventWithStats } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Users, Map, Trophy, Clock, AlertTriangle } from "lucide-react";

interface EventStatisticsProps {
  eventId: number;
}

export default function EventStatistics({ eventId }: EventStatisticsProps) {
  const { data: eventStats, isLoading } = useQuery<EventWithStats>({
    queryKey: [`/api/events/${eventId}/stats`],
    enabled: !!eventId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Calculate checkpoint progress
  const checkpointProgress = eventStats
    ? (eventStats.completedCheckpoints / Math.max(1, eventStats.totalCheckpoints)) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="p-4 border-t border-border/30">
        <h3 className="text-sm font-medium text-primary/80 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-1" /> LIVE EVENT STATISTICS
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }

  if (!eventStats) {
    return (
      <div className="p-4 border-t border-border/30">
        <h3 className="text-sm font-medium text-primary/80 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-1" /> LIVE EVENT STATISTICS
        </h3>
        <div className="bg-background/80 p-4 rounded-lg text-center text-muted-foreground">
          No statistics available
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/30">
      <div className="p-4">
        <h3 className="text-sm font-medium text-primary/80 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-1" /> LIVE EVENT STATISTICS
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-background/80 backdrop-blur-sm rounded-lg p-3 overflow-hidden relative group hover:bg-background/90 transition-colors">
            <div className="absolute top-0 right-0 h-full w-1 bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors"></div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Users className="w-3 h-3 mr-1 text-blue-500" /> Participants
            </div>
            <div className="text-xl font-medium">
              {eventStats.activeParticipants} <span className="text-sm text-blue-500/70">/ {eventStats.participantCount}</span>
            </div>
          </Card>
          
          <Card className="bg-background/80 backdrop-blur-sm rounded-lg p-3 overflow-hidden relative group hover:bg-background/90 transition-colors">
            <div className="absolute top-0 right-0 h-full w-1 bg-green-500/20 group-hover:bg-green-500/40 transition-colors"></div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Map className="w-3 h-3 mr-1 text-green-500" /> Distance
            </div>
            <div className="text-xl font-medium">
              {eventStats.route?.distance?.toFixed(1) || 21}<span className="text-sm text-green-500/70"> km</span>
            </div>
          </Card>
          
          <Card className="bg-background/80 backdrop-blur-sm rounded-lg p-3 overflow-hidden relative group hover:bg-background/90 transition-colors">
            <div className="absolute top-0 right-0 h-full w-1 bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors"></div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Trophy className="w-3 h-3 mr-1 text-amber-500" /> Lead Progress
            </div>
            <div className="text-xl font-medium">
              {eventStats.leadParticipant?.distance?.toFixed(1) || 0}<span className="text-sm text-amber-500/70"> km</span>
            </div>
          </Card>
        </div>
        
        <Card className="mt-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 hover:bg-background/90 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm flex items-center">
              <AlertTriangle className={`w-3.5 h-3.5 mr-1 ${eventStats.alertsCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} /> 
              <span>Checkpoint Progress</span>
              {eventStats.alertsCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full ml-2">
                  {eventStats.alertsCount} Alert{eventStats.alertsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {eventStats.completedCheckpoints}/{eventStats.totalCheckpoints} checkpoints
            </div>
          </div>
          
          <Progress value={checkpointProgress} className="h-2.5" />
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <div className="text-primary">Start</div>
            {Array.from({ length: eventStats.totalCheckpoints - 1 }).map((_, index) => (
              <div 
                key={index}
                className={`font-mono ${index < eventStats.completedCheckpoints - 1 ? 'text-primary' : ''}`}
              >
                CP{index + 1}
              </div>
            ))}
            <div className={eventStats.completedCheckpoints === eventStats.totalCheckpoints ? 'text-primary' : ''}>
              Finish
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
