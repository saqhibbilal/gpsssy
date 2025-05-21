import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Map, 
  LineChart, 
  Route as RouteIcon, 
  Users, 
  Calendar, 
  Settings, 
  AlertTriangle,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertInfo } from "@shared/schema";

interface SidebarProps {
  activeEventId: number;
}

export default function Sidebar({ activeEventId }: SidebarProps) {
  const [location] = useLocation();
  
  // Fetch active alerts for the badge
  const { data: alerts } = useQuery<AlertInfo[]>({
    queryKey: [`/api/events/${activeEventId}/alerts`],
    enabled: !!activeEventId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const activeAlertsCount = alerts?.length || 0;

  const navItems = [
    { path: "/", icon: <Map />, label: "Live Tracking" },
    { path: "/analytics", icon: <LineChart />, label: "Analytics" },
    { path: "/routes", icon: <RouteIcon />, label: "Routes" },
    { path: "/participants", icon: <Users />, label: "Participants" },
    { path: "/devices", icon: <Smartphone />, label: "Devices" },
    { path: "/events", icon: <Calendar />, label: "Events" },
    { path: "/settings", icon: <Settings />, label: "Settings" },
  ];

  return (
    <div className="hidden md:flex flex-col w-16 lg:w-64 bg-sidebar">
      <div className="flex flex-col h-full">
        {/* Navigation title - only visible on large screens */}
        <div className="hidden lg:block px-4 py-6">
          <h3 className="text-lg font-semibold text-center text-sidebar-foreground/40  mb-4">
     Admin Navigation Panel
  </h3>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a className={`flex items-center px-4 py-3 ${
                    location === item.path
                      ? "text-sidebar-foreground bg-sidebar-accent/10"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/5"
                  }`}>
                    <span className="text-sidebar-primary">{item.icon}</span>
                    <span className="ml-3 hidden lg:block">{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* SOS Alerts section */}
        <div className="p-4">
          {activeAlertsCount > 0 ? (
            <div className="bg-background rounded-lg p-3 mb-2">
              <div className="flex items-center">
                <AlertTriangle className="text-destructive mr-2 animate-pulse" />
                <div>
                  <h4 className="font-medium">SOS Alerts</h4>
                  <p className="text-sm text-sidebar-foreground/60">
                    {activeAlertsCount} active {activeAlertsCount === 1 ? 'alert' : 'alerts'}
                  </p>
                </div>
              </div>
              <div className="mt-2 lg:block">
                <Link href="/">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full text-sm"
                  >
                    View Alerts
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-background rounded-lg p-3 mb-2 hidden lg:block">
              <div className="flex items-center">
                <div>
                  <h4 className="font-medium">System Status</h4>
                  <div className="flex items-center mt-1">
                    <span className="status-indicator status-active mr-2"></span>
                    <p className="text-sm text-sidebar-foreground/60">All systems operational</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Compact alert button for small sidebar */}
          {activeAlertsCount > 0 && (
            <Link href="/">
              <Button 
                variant="destructive" 
                size="icon"
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
