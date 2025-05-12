import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Checkpoint } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MapPin, Flag, Route as RouteIcon } from "lucide-react";
import { formatDistance } from "@/lib/maps";
import RouteForm from "@/components/routes/RouteForm";
import { Skeleton } from "@/components/ui/skeleton";

interface RoutesProps {
  eventId: number;
}

export default function Routes({ eventId }: RoutesProps) {
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState(false);
  
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  const { data: eventRoutes } = useQuery<Route[]>({
    queryKey: [`/api/events/${eventId}/route`],
    enabled: !!eventId,
  });

  const { data: checkpoints, isLoading: checkpointsLoading } = useQuery<Checkpoint[]>({
    queryKey: [`/api/routes/${routes?.[0]?.id}/checkpoints`],
    enabled: !!routes && routes.length > 0,
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Routes</h1>
          <p className="text-muted-foreground">
            Create and manage routes for your events
          </p>
        </div>
        <Button onClick={() => setIsCreateRouteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Route
        </Button>
      </div>

      {/* Current Event Route Section */}
      {eventRoutes && eventRoutes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Event Route</h2>
          <Card>
            <CardHeader>
              <CardTitle>{eventRoutes[0].name}</CardTitle>
              <CardDescription>{eventRoutes[0].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <RouteIcon className="mr-2 h-5 w-5 text-primary" />
                  <span>Distance: {formatDistance(eventRoutes[0].distance)}</span>
                </div>
                <div className="flex items-center">
                  <Flag className="mr-2 h-5 w-5 text-primary" />
                  <span>Checkpoints: {
                    checkpointsLoading 
                      ? "Loading..." 
                      : checkpoints?.filter(c => c.routeId === eventRoutes[0].id).length || 0
                  }</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Routes Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Routes</h2>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routes?.map(route => (
              <Card key={route.id}>
                <CardHeader>
                  <CardTitle>{route.name}</CardTitle>
                  <CardDescription>{route.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <RouteIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Distance: {formatDistance(route.distance)}</span>
                    </div>
                    <div className="flex items-center">
                      <Flag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Checkpoints: {
                        checkpointsLoading 
                          ? "Loading..." 
                          : checkpoints?.filter(c => c.routeId === route.id).length || 0
                      }</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Route Dialog */}
      <Dialog open={isCreateRouteOpen} onOpenChange={setIsCreateRouteOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          <RouteForm onSuccess={() => setIsCreateRouteOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
