import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ParticipantWithTracking } from "@shared/schema";
import { Filter, Search, Users, AlertTriangle, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ParticipantItem from "./ParticipantItem";

interface ParticipantsListProps {
  eventId: number;
  onParticipantSelect: (participantId: number) => void;
  selectedParticipantId?: number;
}

export default function ParticipantsList({ 
  eventId, 
  onParticipantSelect,
  selectedParticipantId 
}: ParticipantsListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  
  const { data: participants, isLoading } = useQuery<ParticipantWithTracking[]>({
    queryKey: [`/api/events/${eventId}/participants/tracking`],
    enabled: !!eventId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Filter participants
  const filteredParticipants = participants?.filter(participant => {
    // Apply status filter
    if (filter === "active" && participant.status !== "active") return false;
    if (filter === "alerts" && (!participant.latestPosition?.hasAlert)) return false;
    
    // Apply search query
    if (searchQuery && !participant.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !participant.number.toString().includes(searchQuery)) {
      return false;
    }
    
    return true;
  }) || [];

  // Count participants by status
  const totalCount = participants?.length || 0;
  const activeCount = participants?.filter(p => p.status === "active").length || 0;
  const alertsCount = participants?.filter(p => p.latestPosition?.hasAlert).length || 0;
  
  // Sort participants - alerts first, then by distance
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    // Alerts always come first
    if (a.latestPosition?.hasAlert && !b.latestPosition?.hasAlert) return -1;
    if (!a.latestPosition?.hasAlert && b.latestPosition?.hasAlert) return 1;
    
    // Then sort by distance (descending)
    return (b.distance || 0) - (a.distance || 0);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-primary/80" />
            <h2 className="text-base font-medium">Live Tracking</h2>
            {alertsCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-500 border-red-500/20">
                <AlertTriangle className="w-3 h-3 mr-1" /> {alertsCount} Alert{alertsCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        {showSearch && (
          <div className="mb-3">
            <Input
              placeholder="Search by name or bib number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/80 rounded-lg text-sm"
            />
          </div>
        )}
        
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-background/40 p-1">
            <TabsTrigger value="all" className="text-xs flex items-center py-1.5 data-[state=active]:bg-background/80">
              <Activity className="h-3 w-3 mr-1 text-primary/70" />
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs flex items-center py-1.5 data-[state=active]:bg-background/80">
              <MapPin className="h-3 w-3 mr-1 text-green-500" />
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs flex items-center py-1.5 data-[state=active]:bg-background/80">
              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
              Alerts ({alertsCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Participants List */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedParticipants.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground bg-background/30 m-4 rounded-lg">
            No participants found
          </div>
        ) : (
          sortedParticipants.map((participant) => (
            <ParticipantItem
              key={participant.id}
              participant={participant}
              isSelected={participant.id === selectedParticipantId}
              onClick={() => onParticipantSelect(participant.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
