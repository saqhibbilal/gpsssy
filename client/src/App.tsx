import { useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppShell from "@/components/layout/AppShell";
import LiveTracking from "@/pages/LiveTracking";
import Events from "@/pages/Events";
import Routespage from "@/pages/Routespage";
import Participants from "@/pages/Participants";
import Analytics from "@/pages/Analytics";
import Devices from "@/pages/Devices";
import Settings from "@/pages/Settings";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketMessage } from "@shared/schema";

function App() {
  const { lastMessage } = useWebSocket<WebSocketMessage>();
  const [activeEventId, setActiveEventId] = useState<number>(1);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      // Process real-time updates
      switch (lastMessage.type) {
        case 'position_update':
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/participants/tracking`] });
          break;
        case 'alert':
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/alerts`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/participants/tracking`] });
          break;
        case 'event_update':
          queryClient.invalidateQueries({ queryKey: [`/api/events`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/stats`] });
          break;
        case 'participant_status':
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/participants`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${activeEventId}/participants/tracking`] });
          break;
      }
    }
  }, [lastMessage, activeEventId]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell activeEventId={activeEventId} onEventChange={setActiveEventId}>
          <Switch>
            <Route path="/" component={() => <LiveTracking eventId={activeEventId} />} />
            <Route path="/events" component={() => <Events activeEventId={activeEventId} onEventSelect={setActiveEventId} />} />
            <Route path="/routes" component={() => <Routespage eventId={activeEventId} />} />
            <Route path="/participants" component={() => <Participants eventId={activeEventId} />} />
            <Route path="/analytics" component={() => <Analytics eventId={activeEventId} />} />
            <Route path="/devices" component={() => <Devices activeEventId={activeEventId} />} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
