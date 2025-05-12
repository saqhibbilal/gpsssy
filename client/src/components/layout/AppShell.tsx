import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Event } from "@shared/schema";

interface AppShellProps {
  children: ReactNode;
  activeEventId: number;
  onEventChange: (eventId: number) => void;
}

export default function AppShell({ children, activeEventId, onEventChange }: AppShellProps) {
  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: activeEvent } = useQuery<Event>({
    queryKey: [`/api/events/${activeEventId}`],
    enabled: !!activeEventId,
  });

  return (
    <div className="flex flex-col h-screen">
      <Header 
        activeEvent={activeEvent}
        events={events || []}
        onEventChange={onEventChange}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeEventId={activeEventId} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
