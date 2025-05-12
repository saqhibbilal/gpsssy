import { useState, useEffect } from 'react';
import { Device, Participant } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { Battery, Smartphone, Clock, Tag, Wifi, AlertTriangle } from 'lucide-react';

// Form schema for device creation
const deviceFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  type: z.string().min(1, { message: 'Type is required.' }),
  serialNumber: z.string().min(1, { message: 'Serial number is required.' }),
  status: z.string().min(1, { message: 'Status is required.' }),
  batteryLevel: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().min(0).max(100).nullable()
  ),
});

interface DevicesProps {
  activeEventId: number;
}

export default function Devices({ activeEventId }: DevicesProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>('available');
  const [deviceBatteryLevel, setDeviceBatteryLevel] = useState<number | null>(100);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch all devices
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
    refetchInterval: 10000,
  });

  // Fetch unassigned devices
  const { data: unassignedDevices = [] } = useQuery<Device[]>({
    queryKey: ['/api/devices/unassigned'],
    refetchInterval: 10000,
  });
  
  // Fetch participants for the active event
  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/events', activeEventId, 'participants'],
    enabled: isAssignModalOpen,
  });

  // Get device types from existing devices (unique values)
  const deviceTypes = [...new Set(devices.map((device: Device) => device.type))];

  // Query for selected device details
  const { data: selectedDevice } = useQuery<Device>({
    queryKey: ['/api/devices', selectedDeviceId],
    enabled: !!selectedDeviceId,
  });
  
  // Update local state when device is selected
  useEffect(() => {
    if (selectedDevice) {
      setDeviceStatus(selectedDevice.status);
      setDeviceBatteryLevel(selectedDevice.batteryLevel);
    }
  }, [selectedDevice]);

  // Add a new device
  const addDeviceMutation = useMutation({
    mutationFn: async (device: z.infer<typeof deviceFormSchema>) => {
      return apiRequest('/api/devices', {
        method: 'POST',
        body: JSON.stringify(device),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices/unassigned'] });
      toast({
        title: 'Device added',
        description: 'The device has been successfully added.',
      });
      setIsAddDeviceOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add device. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to add device:', error);
    },
  });

  // Update a device
  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, device }: { id: number; device: Partial<Device> }) => {
      return apiRequest(`/api/devices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(device),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices/unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices', selectedDeviceId] });
      toast({
        title: 'Device updated',
        description: 'The device has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update device. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update device:', error);
    },
  });
  
  // Unassign a device
  const unassignDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      return apiRequest(`/api/devices/${deviceId}/unassign`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices/unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices', selectedDeviceId] });
      toast({
        title: 'Device unassigned',
        description: 'The device has been unassigned successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to unassign device. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to unassign device:', error);
    },
  });
  
  // Assign a device to a participant
  const assignDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, participantId }: { deviceId: number; participantId: number }) => {
      return apiRequest(`/api/devices/${deviceId}/assign/${participantId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices/unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/devices', selectedDeviceId] });
      toast({
        title: 'Device assigned',
        description: 'The device has been assigned successfully.',
      });
      setIsAssignModalOpen(false);
      setSelectedParticipantId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to assign device. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to assign device:', error);
    },
  });

  // Form setup
  const form = useForm<z.infer<typeof deviceFormSchema>>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: '',
      type: '',
      serialNumber: '',
      status: 'available',
      batteryLevel: 100,
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof deviceFormSchema>) {
    addDeviceMutation.mutate(values);
  }

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-500';
      case 'assigned':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'disabled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  // Battery level visualization
  function renderBatteryLevel(level: number | null) {
    if (level === null) return null;
    
    let color = 'text-green-500';
    if (level < 20) color = 'text-red-500';
    else if (level < 50) color = 'text-yellow-500';
    
    return (
      <div className="flex items-center gap-2">
        <Battery className={color} />
        <span>{level}%</span>
      </div>
    );
  }

  // Filter devices based on selected tab
  const filteredDevices = devices.filter((device: Device) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unassigned') return device.assignedTo === null;
    return device.type === selectedTab;
  });

  function formatDate(date: Date | null | string) {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">Manage tracking devices for your events</p>
        </div>
        <Button onClick={() => setIsAddDeviceOpen(true)}>Add Device</Button>
      </div>

      <Tabs defaultValue="all" className="w-full" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Devices</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          {deviceTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p>Loading devices...</p>
                </CardContent>
              </Card>
            ) : filteredDevices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p>No devices found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredDevices.map((device: Device) => (
                <Card 
                  key={device.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{device.name}</CardTitle>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                    <CardDescription>{device.serialNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>{device.type}</span>
                      </div>
                      {renderBatteryLevel(device.batteryLevel)}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last seen: {formatDate(device.lastSeen)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="w-full">
                      {device.assignedTo ? (
                        <Badge variant="outline" className="w-full justify-center">
                          <Tag className="h-3 w-3 mr-1" />
                          Assigned to Participant #{device.assignedTo}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-full justify-center">
                          <Wifi className="h-3 w-3 mr-1" />
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Device Dialog */}
      <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Enter the details of the new tracking device.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="GPS Tracker 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GPS">GPS</SelectItem>
                        <SelectItem value="Smartphone">Smartphone</SelectItem>
                        <SelectItem value="Wearable">Wearable</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="GPS-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batteryLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Battery Level (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="100"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? '' : parseInt(value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDeviceOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addDeviceMutation.isPending}>
                  {addDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Device Details Dialog */}
      <Dialog open={!!selectedDeviceId} onOpenChange={(open) => !open && setSelectedDeviceId(null)}>
        {selectedDevice && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedDevice.name}
                <Badge className={getStatusColor(selectedDevice.status)}>
                  {selectedDevice.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedDevice.type} - {selectedDevice.serialNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Battery Level</h4>
                  <div className="text-xl font-semibold mt-1 flex items-center gap-2">
                    {renderBatteryLevel(selectedDevice.batteryLevel)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Last Seen</h4>
                  <div className="text-xl font-semibold mt-1">
                    {formatDate(selectedDevice.lastSeen)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Assignment</h4>
                {selectedDevice.assignedTo ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        <Tag className="h-3 w-3 mr-1" />
                        Assigned to Participant #{selectedDevice.assignedTo}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Used by participant in active event
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to unassign this device?')) {
                          unassignDeviceMutation.mutate(selectedDevice.id);
                        }
                      }}
                    >
                      Unassign
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        <Wifi className="h-3 w-3 mr-1" />
                        Unassigned
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        This device is not assigned to any participant
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAssignModalOpen(true)}
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                  <Select 
                    defaultValue={selectedDevice.status}
                    onValueChange={(value) => {
                      setDeviceStatus(value);
                      updateDeviceMutation.mutate({
                        id: selectedDevice.id,
                        device: { status: value }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Battery Level</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={deviceBatteryLevel ?? 0}
                      onChange={(e) => setDeviceBatteryLevel(Number(e.target.value))}
                      className="w-24"
                    />
                    <span>%</span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateDeviceMutation.mutate({
                          id: selectedDevice.id,
                          device: { batteryLevel: deviceBatteryLevel }
                        });
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {selectedDevice.status === 'maintenance' && (
                <div className="flex items-center p-3 bg-amber-500/10 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-sm">This device is currently under maintenance.</span>
                </div>
              )}

              {selectedDevice.batteryLevel !== null && selectedDevice.batteryLevel < 20 && (
                <div className="flex items-center p-3 bg-red-500/10 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm">Low battery! Please charge or replace batteries soon.</span>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Assign Participant Dialog */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Device to Participant</DialogTitle>
            <DialogDescription>
              Select a participant to assign this device to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="participant" className="text-sm font-medium text-muted-foreground">Participant</Label>
            <Select 
              value={selectedParticipantId?.toString() || ""} 
              onValueChange={(value) => setSelectedParticipantId(Number(value))}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select a participant" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id.toString()}>
                    #{participant.number} - {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedParticipantId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!selectedParticipantId || assignDeviceMutation.isPending} 
              onClick={() => {
                if (selectedDeviceId && selectedParticipantId) {
                  assignDeviceMutation.mutate({
                    deviceId: selectedDeviceId,
                    participantId: selectedParticipantId
                  });
                }
              }}
            >
              Assign Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}