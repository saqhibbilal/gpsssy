import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Plus, Bell, Menu, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EventForm from "@/components/events/EventForm";
import { Event } from "@shared/schema";

interface HeaderProps {
  activeEvent?: Event;
  events: Event[];
  onEventChange: (eventId: number) => void;
}

export default function Header({ activeEvent, events, onEventChange }: HeaderProps) {
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card shadow-lg z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <MapPin className="text-primary mr-2" />
            <Link href="/">
              <a className="font-bold text-xl">TrackPro</a>
            </Link>
          </div>
          
          <div className="flex items-center">
            {activeEvent && (
              <div className="mr-4 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center bg-background">
                      <span>{activeEvent.name}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {events.map((event) => (
                      <DropdownMenuItem 
                        key={event.id}
                        onClick={() => onEventChange(event.id)}
                      >
                        {event.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                className="bg-primary text-white flex items-center"
                onClick={() => setIsEventFormOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                New Event
              </Button>
              
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="ml-2">Admin</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-2">
          <div className="space-y-2">
            <Button 
              className="w-full bg-primary text-white flex items-center justify-center"
              onClick={() => {
                setIsEventFormOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              New Event
            </Button>
            
            <div className="flex items-center p-2">
              <Bell className="h-5 w-5 mr-2" />
              <span>Notifications</span>
            </div>
            
            <div className="flex items-center p-2">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span>Admin</span>
            </div>
          </div>
        </div>
      )}

      {/* New Event Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm 
            onSuccess={() => setIsEventFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}
