import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Save, User, Lock, Bell, MapPin, Wifi, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    name: "Admin User",
    email: "admin@trackpro.com",
    password: "••••••••",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    emergencyNotifications: true,
    systemUpdates: true,
  });

  const [mapSettings, setMapSettings] = useState({
    defaultZoom: "13",
    refreshRate: "5",
    showParticipantNames: true,
    showCheckpoints: true,
    alwaysShowRoute: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    trackingDataRetention: "30",
    autoBackup: true,
    debugMode: false,
  });

  const handleAccountSave = () => {
    toast({
      title: "Account settings saved",
      description: "Your account information has been updated"
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated"
    });
  };

  const handleMapSave = () => {
    toast({
      title: "Map settings saved",
      description: "Your map preferences have been updated"
    });
  };

  const handleSystemSave = () => {
    toast({
      title: "System settings saved",
      description: "System configuration has been updated"
    });
  };

  return (
    <div className="overflow-y-auto max-h-screen"> 
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your account, notifications, and system preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4 mr-2" />
            Map
          </TabsTrigger>
          <TabsTrigger value="system">
            <Wifi className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Change Password</Label>
                <div className="flex">
                  <Input 
                    id="password" 
                    type="password"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                  />
                  <Button variant="outline" className="ml-2">
                    <Lock className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAccountSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, emailAlerts: checked})
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                </div>
                <Switch 
                  checked={notificationSettings.smsAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, smsAlerts: checked})
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Emergency Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get instant alerts for SOS signals</p>
                </div>
                <Switch 
                  checked={notificationSettings.emergencyNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, emergencyNotifications: checked})
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about system changes</p>
                </div>
                <Switch 
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, systemUpdates: checked})
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNotificationSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Map Settings */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Map Configuration</CardTitle>
              <CardDescription>
                Customize the map display and tracking settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultZoom">Default Zoom Level</Label>
                  <Input 
                    id="defaultZoom" 
                    type="number"
                    value={mapSettings.defaultZoom}
                    onChange={(e) => setMapSettings({...mapSettings, defaultZoom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refreshRate">Data Refresh Rate (seconds)</Label>
                  <Input 
                    id="refreshRate" 
                    type="number"
                    value={mapSettings.refreshRate}
                    onChange={(e) => setMapSettings({...mapSettings, refreshRate: e.target.value})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showParticipantNames">Show Participant Names</Label>
                  <Switch 
                    id="showParticipantNames"
                    checked={mapSettings.showParticipantNames}
                    onCheckedChange={(checked) => 
                      setMapSettings({...mapSettings, showParticipantNames: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showCheckpoints">Show Checkpoints</Label>
                  <Switch 
                    id="showCheckpoints"
                    checked={mapSettings.showCheckpoints}
                    onCheckedChange={(checked) => 
                      setMapSettings({...mapSettings, showCheckpoints: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="alwaysShowRoute">Always Show Route</Label>
                  <Switch 
                    id="alwaysShowRoute"
                    checked={mapSettings.alwaysShowRoute}
                    onCheckedChange={(checked) => 
                      setMapSettings({...mapSettings, alwaysShowRoute: checked})
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleMapSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Map Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide behavior and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trackingDataRetention">Tracking Data Retention (days)</Label>
                <Input 
                  id="trackingDataRetention" 
                  type="number"
                  value={systemSettings.trackingDataRetention}
                  onChange={(e) => setSystemSettings({...systemSettings, trackingDataRetention: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep detailed tracking data before compressing
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoBackup">Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">Backup event data daily</p>
                  </div>
                  <Switch 
                    id="autoBackup"
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, autoBackup: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debugMode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable detailed logging and diagnostics</p>
                  </div>
                  <Switch 
                    id="debugMode"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, debugMode: checked})
                    }
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 border border-destructive/20 bg-destructive/10 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    These actions can result in data loss and cannot be undone.
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="destructive" size="sm">
                      Clear All Tracking Data
                    </Button>
                    <Button variant="outline" size="sm">
                      Reset System Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSystemSave}>
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
