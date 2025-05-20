import { useQuery } from "@tanstack/react-query";
import { ParticipantWithTracking, EventWithStats, TrackingPoint } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, BarChart, AreaChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AnalyticsProps {
  eventId: number;
}

export default function Analytics({ eventId }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<string>("all");
  
  const { data: eventStats, isLoading: statsLoading } = useQuery<EventWithStats>({
  queryKey: [`/api/events/${eventId}/stats`],
  enabled: !!eventId,
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<ParticipantWithTracking[]>({
    queryKey: [`/api/events/${eventId}/participants/tracking`],
    enabled: !!eventId,
  });

  // Prepare data for pace chart
  const paceData = participants
    ?.filter(p => p.status === "active" && p.distance && p.distance > 0)
    .map(p => ({
      name: p.name.split(' ')[0],
      number: p.number,
      distance: p.distance?.toFixed(1),
      pace: p.distance && p.duration ? calculatePace(p.distance, p.duration) : 0,
    })) || [];

  // Prepare data for checkpoint progress
  const checkpointData = participants
    ?.filter(p => p.checkpointsCompleted !== undefined)
    .map(p => ({
      name: p.name.split(' ')[0],
      completed: p.checkpointsCompleted || 0,
      remaining: ((eventStats?.totalCheckpoints || 0) - (p.checkpointsCompleted || 0)),
    })) || [];

  // Prepare distribution data
  const distanceDistribution = [
    { name: '0-5km', count: participants?.filter(p => (p.distance || 0) < 5).length || 0 },
    { name: '5-10km', count: participants?.filter(p => (p.distance || 0) >= 5 && (p.distance || 0) < 10).length || 0 },
    { name: '10-15km', count: participants?.filter(p => (p.distance || 0) >= 10 && (p.distance || 0) < 15).length || 0 },
    { name: '15-20km', count: participants?.filter(p => (p.distance || 0) >= 15 && (p.distance || 0) < 20).length || 0 },
    { name: '20km+', count: participants?.filter(p => (p.distance || 0) >= 20).length || 0 },
  ];

  // Calculate pace from distance and duration
  function calculatePace(distance: number, durationStr: string): number {
    const [hours, minutes, seconds] = durationStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    return Math.round((totalMinutes / distance) * 10) / 10; // min/km, rounded to 1 decimal
  }

  return (
   <div className="container mx-auto py-6 px-4 overflow-y-auto max-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Event statistics and performance metrics
          </p>
        </div>
        
        <Tabs
          value={timeRange}
          onValueChange={setTimeRange}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full md:w-[300px]">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="hour">Last Hour</TabsTrigger>
            <TabsTrigger value="real-time">Real-time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Event Summary */}
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {eventStats?.activeParticipants || 0}
                <span className="text-sm text-muted-foreground ml-1">/ {eventStats?.participantCount || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Lead Participant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-xl font-bold">
                  {eventStats?.leadParticipant?.name.split(' ')[0] || "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {eventStats?.leadParticipant?.distance?.toFixed(1) || 0} km completed
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Checkpoints Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div>
                <div className="text-3xl font-bold">
                  {eventStats?.completedCheckpoints || 0}
                  <span className="text-sm text-muted-foreground ml-1">/ {eventStats?.totalCheckpoints || 0}</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${eventStats
                        ? (eventStats.completedCheckpoints / Math.max(1, eventStats.totalCheckpoints)) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Participant Pace */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Participant Progress</CardTitle>
            <CardDescription>
              Distance covered by top participants
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {participantsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={paceData.sort((a, b) => parseFloat(b.distance) - parseFloat(a.distance)).slice(0, 10)} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={(value, name) => [`${value} km`, 'Distance']} />
                  <Bar dataKey="distance" fill="hsl(var(--chart-1))" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Checkpoint Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Checkpoint Completion</CardTitle>
            <CardDescription>
              Progress through checkpoints by participant
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {participantsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={checkpointData.slice(0, 8)} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  stackOffset="expand"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="hsl(var(--chart-2))" name="Completed" />
                  <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distance Distribution</CardTitle>
            <CardDescription>
              Number of participants by distance range
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {participantsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={distanceDistribution}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" fill="hsl(var(--chart-3))" stroke="hsl(var(--chart-3))" name="Participants" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
