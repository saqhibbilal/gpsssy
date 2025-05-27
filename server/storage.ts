import {
  users, User, InsertUser,
  devices, Device, InsertDevice,
  events, Event, InsertEvent,
  routes, Route, InsertRoute,
  checkpoints, Checkpoint, InsertCheckpoint,
  participants, Participant, InsertParticipant,
  trackingPoints, TrackingPoint, InsertTrackingPoint,
  EventWithStats, ParticipantWithTracking, AlertInfo
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Device operations
  getDevices(): Promise<Device[]>;  
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  getUnassignedDevices(): Promise<Device[]>;
  getDevicesByType(type: string): Promise<Device[]>;
  getDeviceByParticipant(participantId: number): Promise<Device | undefined>;
  assignDeviceToParticipant(deviceId: number, participantId: number): Promise<Device | undefined>;
  unassignDevice(deviceId: number): Promise<Device | undefined>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  getEventWithStats(id: number): Promise<EventWithStats | undefined>;

  // Route operations
  getRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  getRoutesByEvent(eventId: number): Promise<Route[]>;

  // Checkpoint operations
  getCheckpoints(routeId: number): Promise<Checkpoint[]>;
  createCheckpoint(checkpoint: InsertCheckpoint): Promise<Checkpoint>;
  updateCheckpoint(id: number, checkpoint: Partial<InsertCheckpoint>): Promise<Checkpoint | undefined>;
  deleteCheckpoint(id: number): Promise<boolean>;

  // Participant operations
  getParticipants(eventId: number): Promise<Participant[]>;
  getParticipant(id: number): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: number, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;
  getParticipantsWithTracking(eventId: number): Promise<ParticipantWithTracking[]>;

  // Tracking operations
  getTrackingPoints(participantId: number, limit?: number): Promise<TrackingPoint[]>;
  createTrackingPoint(trackingPoint: InsertTrackingPoint): Promise<TrackingPoint>;
  getLatestTrackingPoint(participantId: number): Promise<TrackingPoint | undefined>;
  getActiveAlerts(eventId: number): Promise<AlertInfo[]>;
  resolveAlert(trackingPointId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private devices: Map<number, Device>;
  private events: Map<number, Event>;
  private routes: Map<number, Route>;
  private checkpoints: Map<number, Checkpoint>;
  private participants: Map<number, Participant>;
  private trackingPoints: Map<number, TrackingPoint>;
  
  private currentUserId: number;
  private currentDeviceId: number;
  private currentEventId: number;
  private currentRouteId: number;
  private currentCheckpointId: number;
  private currentParticipantId: number;
  private currentTrackingPointId: number;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.events = new Map();
    this.routes = new Map();
    this.checkpoints = new Map();
    this.participants = new Map();
    this.trackingPoints = new Map();
    
    this.currentUserId = 1;
    this.currentDeviceId = 1;
    this.currentEventId = 1;
    this.currentRouteId = 1;
    this.currentCheckpointId = 1;
    this.currentParticipantId = 1;
    this.currentTrackingPointId = 1;
    
    // Add demo data
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id,role: insertUser.role ?? 'user' };// added this role: insertUser.role ?? 'user'
    this.users.set(id, user);
    return user;
  }

  // Device operations
  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.currentDeviceId++;
    const device: Device = { ...insertDevice, id,status: insertDevice.status ?? 'available', // Default value (added this line)
    batteryLevel: insertDevice.batteryLevel ?? null, // Allow null as per schema (added this line)
    lastSeen: insertDevice.lastSeen ?? null, // Allow null (added this line)
    assignedTo: insertDevice.assignedTo ?? null// Allow null (added this line)
   };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, deviceUpdate: Partial<InsertDevice>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...deviceUpdate };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async getUnassignedDevices(): Promise<Device[]> {
    return Array.from(this.devices.values())
      .filter(device => !device.assignedTo);
  }

  async getDevicesByType(type: string): Promise<Device[]> {
    return Array.from(this.devices.values())
      .filter(device => device.type === type);
  }

  async getDeviceByParticipant(participantId: number): Promise<Device | undefined> {
    return Array.from(this.devices.values())
      .find(device => device.assignedTo === participantId);
  }

  async assignDeviceToParticipant(deviceId: number, participantId: number): Promise<Device | undefined> {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;
    
    // Check if participant exists
    const participant = this.participants.get(participantId);
    if (!participant) return undefined;
    
    // Update device
    const updatedDevice = {
      ...device,
      assignedTo: participantId,
      status: 'assigned',
    };
    
    this.devices.set(deviceId, updatedDevice);
    return updatedDevice;
  }

  async unassignDevice(deviceId: number): Promise<Device | undefined> {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;
    
    // Update device
    const updatedDevice = {
      ...device,
      assignedTo: null,
      status: 'available',
    };
    
    this.devices.set(deviceId, updatedDevice);
    return updatedDevice;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { ...insertEvent, id, // Default value (added this)
    maxParticipants: insertEvent.maxParticipants ?? 100 // added this 
  };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async getEventWithStats(id: number): Promise<EventWithStats | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const allParticipants = Array.from(this.participants.values()).filter(p => p.eventId === id);
    const activeParticipants = allParticipants.filter(p => p.status === 'active');
    
    const trackingPointsByParticipant = new Map<number, TrackingPoint[]>();
    
    // Group tracking points by participant
    for (const point of this.trackingPoints.values()) {
      if (point.eventId === id) {
        const points = trackingPointsByParticipant.get(point.participantId) || [];
        points.push(point);
        trackingPointsByParticipant.set(point.participantId, points);
      }
    } 
    
    // Get active alerts count
    const activeAlerts = Array.from(this.trackingPoints.values()).filter(
      tp => tp.eventId === id && tp.hasAlert && !tp.alertType?.includes('resolved')
    );

    // Get route checkpoints if any
    const eventRoute = event.routeId ? this.routes.get(event.routeId) : undefined;
    const checkpointsForRoute = eventRoute 
      ? Array.from(this.checkpoints.values()).filter(cp => cp.routeId === eventRoute.id)
      : [];
    
    let leadParticipant: ParticipantWithTracking | undefined;
    let maxDistance = 0;
    
    // Process participants with tracking data
    const participantsWithTracking = allParticipants.map(participant => {
      const trackingPoints = trackingPointsByParticipant.get(participant.id) || [];
      const latestPosition = trackingPoints.length > 0 
        ? trackingPoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : undefined;
        
      // Calculate distance traveled (simplified)
      const distance = Math.random() * 20; // Mock distance calculation for this example
      
      // Calculate duration (simplified)
      const now = new Date();
      const hours = Math.floor(Math.random() * 3);
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Track lead participant (most distance)
      if (distance > maxDistance) {
        maxDistance = distance;
        leadParticipant = {
          ...participant,
          latestPosition,
          distance,
          duration,
          checkpointsCompleted: Math.floor(Math.random() * checkpointsForRoute.length),
        };
      }
      
      return {
        ...participant,
        latestPosition,
        distance,
        duration,
        checkpointsCompleted: Math.floor(Math.random() * checkpointsForRoute.length),
      };
    });
    
    return {
      ...event,
      participantCount: allParticipants.length,
      activeParticipants: activeParticipants.length,
      alertsCount: activeAlerts.length,
      completedCheckpoints: 3, // Mock data
      totalCheckpoints: checkpointsForRoute.length,
      leadParticipant,
    };
  }

  // Route operations
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.currentRouteId++;
    const route: Route = { ...insertRoute, id, description: insertRoute.description ?? '', // Default empty string(added this)
    createdBy: insertRoute.createdBy ?? null // Allow null (added this as well)
  };
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: number, routeUpdate: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    
    const updatedRoute = { ...route, ...routeUpdate };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async getRoutesByEvent(eventId: number): Promise<Route[]> {
    const event = this.events.get(eventId);
    if (!event || !event.routeId) return [];
    
    const route = this.routes.get(event.routeId);
    return route ? [route] : [];
  }

  // Checkpoint operations
  async getCheckpoints(routeId: number): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(checkpoint => checkpoint.routeId === routeId)
      .sort((a, b) => a.order - b.order);
  }

  async createCheckpoint(insertCheckpoint: InsertCheckpoint): Promise<Checkpoint> {
    const id = this.currentCheckpointId++;
    const checkpoint: Checkpoint = { ...insertCheckpoint, id ,
      radius: insertCheckpoint.radius ?? 50// made this change
    };
    this.checkpoints.set(id, checkpoint);
    return checkpoint;
  }

  async updateCheckpoint(id: number, checkpointUpdate: Partial<InsertCheckpoint>): Promise<Checkpoint | undefined> {
    const checkpoint = this.checkpoints.get(id);
    if (!checkpoint) return undefined;
    
    const updatedCheckpoint = { ...checkpoint, ...checkpointUpdate };
    this.checkpoints.set(id, updatedCheckpoint);
    return updatedCheckpoint;
  }

  async deleteCheckpoint(id: number): Promise<boolean> {
    return this.checkpoints.delete(id);
  }

  // Participant operations
  async getParticipants(eventId: number): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(participant => participant.eventId === eventId);
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const participant: Participant = { ...insertParticipant, id, 
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipant(id: number, participantUpdate: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...participantUpdate };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  async getParticipantsWithTracking(eventId: number): Promise<ParticipantWithTracking[]> {
    const participants = await this.getParticipants(eventId);
    const result: ParticipantWithTracking[] = [];
    
    for (const participant of participants) {
      const latestPosition = await this.getLatestTrackingPoint(participant.id);
      
      // Calculate distance (simplified calculation)
      const distance = Math.floor(Math.random() * 20 * 10) / 10; // Random distance up to 20km
      
      // Calculate duration
      const hours = Math.floor(Math.random() * 3);
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      result.push({
        ...participant,
        latestPosition,
        distance,
        duration,
        checkpointsCompleted: Math.floor(Math.random() * 5), // Random 0-4 checkpoints completed
      });
    }
    
    return result;
  }

  // Tracking operations
  async getTrackingPoints(participantId: number, limit = 100): Promise<TrackingPoint[]> {
    const points = Array.from(this.trackingPoints.values())
      .filter(point => point.participantId === participantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return points.slice(0, limit);
  }

  async createTrackingPoint(insertTrackingPoint: InsertTrackingPoint): Promise<TrackingPoint> {
    const id = this.currentTrackingPointId++;
    const trackingPoint: TrackingPoint = { ...insertTrackingPoint, id, speed: insertTrackingPoint.speed ?? null, // Allow null
    battery: insertTrackingPoint.battery ?? null, // Allow null
    elevation: insertTrackingPoint.elevation ?? null, // Allow null
    hasAlert: insertTrackingPoint.hasAlert ?? false, // Default value
    alertType: insertTrackingPoint.alertType ?? null // Added all these
   };
    this.trackingPoints.set(id, trackingPoint);
    return trackingPoint;
  }

  async getLatestTrackingPoint(participantId: number): Promise<TrackingPoint | undefined> {
    const points = Array.from(this.trackingPoints.values())
      .filter(point => point.participantId === participantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return points.length > 0 ? points[0] : undefined;
  }

  async getActiveAlerts(eventId: number): Promise<AlertInfo[]> {
    const activeAlertPoints = Array.from(this.trackingPoints.values())
      .filter(point => 
        point.eventId === eventId && 
        point.hasAlert && 
        !point.alertType?.includes('resolved')
      );
    
    const result: AlertInfo[] = [];
    
    for (const point of activeAlertPoints) {
      const participant = this.participants.get(point.participantId);
      if (participant) {
        result.push({
          participantId: point.participantId,
          alertType: point.alertType || 'unknown',
          timestamp: new Date(point.timestamp),
          location: point.location as any,
          participantName: participant.name,
          participantNumber: participant.number,
        });
      }
    }
    
    return result;
  }

  async resolveAlert(trackingPointId: number): Promise<boolean> {
    const point = this.trackingPoints.get(trackingPointId);
    if (!point) return false;
    
    const resolvedPoint = {
      ...point,
      alertType: `${point.alertType}-resolved`,
      hasAlert: false,
    };
    
    this.trackingPoints.set(trackingPointId, resolvedPoint);
    return true;
  }

  // Helper method to seed demo data
  private seedData() {
    // Create admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      email: 'admin@trackpro.com',
      role: 'admin',
    });
    
    // Create some sample devices
    this.createDevice({
      name: 'GPS Tracker 1',
      type: 'GPS',
      serialNumber: 'GPS-001',
      status: 'available',
      batteryLevel: 100,
      lastSeen: new Date(),
      assignedTo: null,
    });
    
    this.createDevice({
      name: 'GPS Tracker 2',
      type: 'GPS',
      serialNumber: 'GPS-002',
      status: 'available',
      batteryLevel: 95,
      lastSeen: new Date(),
      assignedTo: null,
    });
    
    this.createDevice({
      name: 'Smartphone A',
      type: 'Smartphone',
      serialNumber: 'SM-001',
      status: 'assigned',
      batteryLevel: 80,
      lastSeen: new Date(),
      assignedTo: 1,
    });
    
    this.createDevice({
      name: 'Smart Watch X',
      type: 'Wearable',
      serialNumber: 'SW-001',
      status: 'assigned',
      batteryLevel: 75,
      lastSeen: new Date(),
      assignedTo: 2,
    });
    
    this.createDevice({
      name: 'GPS Tracker 3',
      type: 'GPS',
      serialNumber: 'GPS-003',
      status: 'maintenance',
      batteryLevel: 20,
      lastSeen: new Date(Date.now() - 86400000), // 1 day ago
      assignedTo: null,
    });

    // Create a sample route
    const routePath = {
      type: 'LineString',
      coordinates: [
        [-122.4194, 37.7749],
        [-122.4101, 37.7853],
        [-122.4021, 37.7891],
        [-122.3957, 37.7915],
        [-122.3906, 37.7944],
      ]
    };
    
    const route = this.createRoute({
      name: 'Mountain Challenge Route',
      description: 'A challenging mountain bike route with steep climbs and descents',
      distance: 21.5,
      path: routePath,
      createdBy: 1,
    });

    // Create checkpoints for the route
    this.createCheckpoint({
      name: 'Start',
      routeId: 1,
      order: 0,
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
      radius: 50,
    });
    
    this.createCheckpoint({
      name: 'CP1',
      routeId: 1,
      order: 1,
      location: { type: 'Point', coordinates: [-122.4101, 37.7853] },
      radius: 50,
    });
    
    this.createCheckpoint({
      name: 'CP2',
      routeId: 1,
      order: 2,
      location: { type: 'Point', coordinates: [-122.4021, 37.7891] },
      radius: 50,
    });
    
    this.createCheckpoint({
      name: 'CP3',
      routeId: 1,
      order: 3,
      location: { type: 'Point', coordinates: [-122.3957, 37.7915] },
      radius: 50,
    });
    
    this.createCheckpoint({
      name: 'Finish',
      routeId: 1,
      order: 4,
      location: { type: 'Point', coordinates: [-122.3906, 37.7944] },
      radius: 50,
    });

    // Create an event
    const now = new Date();
    const eventEndDate = new Date();
    eventEndDate.setHours(now.getHours() + 5);
    
    this.createEvent({
      name: 'Mountain Challenge 2023',
      description: 'Annual mountain biking challenge through scenic trails',
      startDate: now,
      endDate: eventEndDate,
      location: 'San Francisco, CA',
      status: 'active',
      routeId: 1,
      createdBy: 1,
      maxParticipants: 50,
    });

    // Create participants
    const participantNames = [
      'Jay Jay', 'Sarah Johnson', 'Emily Chen', 'Michael Brown',
      'David Wilson', 'Bilal', 'Robert Martinez', 'Lisa Anderson',
      'James Thomas', 'Jennifer Garcia', 'Daniel Lewis', 'Maria Rodriguez'
    ];
    
    const participantStatuses = ['active', 'active', 'active', 'active', 'withdrawn'];
    
    participantNames.forEach((name, index) => {
      const number = index + 1;
      const status = participantStatuses[Math.floor(Math.random() * participantStatuses.length)];
      
      this.createParticipant({
        number,
        name,
        eventId: 1,
        status,
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '123-456-7890',
      });
      
      // Create tracking points for this participant
      if (status === 'active') {
        // Create current position
        const latOffset = (Math.random() * 0.01) - 0.005;
        const lngOffset = (Math.random() * 0.01) - 0.005;
        
        const basePoint = Math.min(index % 5, 4); // Which checkpoint they're closest to
        const routeCoords = routePath.coordinates[basePoint];
        
        const hasAlert = number === 2; // Make Sarah Johnson have an alert
        
        this.createTrackingPoint({
          participantId: number,
          eventId: 1,
          timestamp: new Date(),
          location: { 
            lat: routeCoords[1] + latOffset, 
            lng: routeCoords[0] + lngOffset 
          },
          speed: Math.random() * 20,
          battery: Math.floor(Math.random() * 100),
          elevation: 100 + Math.random() * 500,
          hasAlert,
          alertType: hasAlert ? 'sos' : undefined,
        });
      }
    });
  }
}

export const storage = new MemStorage();
