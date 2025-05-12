import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertEventSchema, 
  insertRouteSchema, 
  insertCheckpointSchema, 
  insertParticipantSchema,
  insertDeviceSchema,
  insertTrackingPointSchema,
  WebSocketMessage
} from "@shared/schema";
import { z } from "zod";

// Keep track of connected clients
const clients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = Date.now().toString();
    clients.set(clientId, ws);
    
    console.log(`WebSocket connected: ${clientId}`);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Process incoming messages based on their type
        if (data.type === 'position_update') {
          const validationResult = insertTrackingPointSchema.safeParse(data.data);
          
          if (validationResult.success) {
            const trackingPoint = await storage.createTrackingPoint(validationResult.data);
            
            // Broadcast the update to all clients
            broadcastMessage({
              type: 'position_update',
              data: trackingPoint
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket disconnected: ${clientId}`);
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected', data: { clientId } }));
  });
  
  // Helper function to broadcast messages to all connected clients
  function broadcastMessage(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Setup simulated tracking updates
  setupSimulatedTracking(broadcastMessage);
  
  // API Routes
  // Events
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });
  
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  });
  
  app.get('/api/events/:id/stats', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const eventWithStats = await storage.getEventWithStats(eventId);
      
      if (!eventWithStats) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(eventWithStats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event statistics' });
    }
  });
  
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const validationResult = insertEventSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid event data', errors: validationResult.error.errors });
      }
      
      const event = await storage.createEvent(validationResult.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create event' });
    }
  });
  
  app.put('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const validationResult = insertEventSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid event data', errors: validationResult.error.errors });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, validationResult.data);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event' });
    }
  });
  
  // Routes
  app.get('/api/routes', async (req: Request, res: Response) => {
    try {
      const routes = await storage.getRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch routes' });
    }
  });
  
  app.get('/api/routes/:id', async (req: Request, res: Response) => {
    try {
      const routeId = parseInt(req.params.id);
      const route = await storage.getRoute(routeId);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch route' });
    }
  });
  
  app.post('/api/routes', async (req: Request, res: Response) => {
    try {
      const validationResult = insertRouteSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid route data', errors: validationResult.error.errors });
      }
      
      const route = await storage.createRoute(validationResult.data);
      res.status(201).json(route);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create route' });
    }
  });
  
  app.get('/api/events/:eventId/route', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const routes = await storage.getRoutesByEvent(eventId);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch routes for event' });
    }
  });
  
  // Checkpoints
  app.get('/api/routes/:routeId/checkpoints', async (req: Request, res: Response) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const checkpoints = await storage.getCheckpoints(routeId);
      res.json(checkpoints);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch checkpoints' });
    }
  });
  
  app.post('/api/checkpoints', async (req: Request, res: Response) => {
    try {
      const validationResult = insertCheckpointSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid checkpoint data', errors: validationResult.error.errors });
      }
      
      const checkpoint = await storage.createCheckpoint(validationResult.data);
      res.status(201).json(checkpoint);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create checkpoint' });
    }
  });
  
  app.put('/api/checkpoints/:id', async (req: Request, res: Response) => {
    try {
      const checkpointId = parseInt(req.params.id);
      const validationResult = insertCheckpointSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid checkpoint data', errors: validationResult.error.errors });
      }
      
      const updatedCheckpoint = await storage.updateCheckpoint(checkpointId, validationResult.data);
      
      if (!updatedCheckpoint) {
        return res.status(404).json({ message: 'Checkpoint not found' });
      }
      
      res.json(updatedCheckpoint);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update checkpoint' });
    }
  });
  
  app.delete('/api/checkpoints/:id', async (req: Request, res: Response) => {
    try {
      const checkpointId = parseInt(req.params.id);
      const success = await storage.deleteCheckpoint(checkpointId);
      
      if (!success) {
        return res.status(404).json({ message: 'Checkpoint not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete checkpoint' });
    }
  });
  
  // Participants
  app.get('/api/events/:eventId/participants', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const participants = await storage.getParticipants(eventId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch participants' });
    }
  });
  
  app.get('/api/events/:eventId/participants/tracking', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const participants = await storage.getParticipantsWithTracking(eventId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch participants with tracking' });
    }
  });
  
  app.get('/api/participants/:id', async (req: Request, res: Response) => {
    try {
      const participantId = parseInt(req.params.id);
      const participant = await storage.getParticipant(participantId);
      
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }
      
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch participant' });
    }
  });
  
  app.post('/api/participants', async (req: Request, res: Response) => {
    try {
      const validationResult = insertParticipantSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid participant data', errors: validationResult.error.errors });
      }
      
      const participant = await storage.createParticipant(validationResult.data);
      res.status(201).json(participant);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create participant' });
    }
  });
  
  app.put('/api/participants/:id', async (req: Request, res: Response) => {
    try {
      const participantId = parseInt(req.params.id);
      const validationResult = insertParticipantSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid participant data', errors: validationResult.error.errors });
      }
      
      const updatedParticipant = await storage.updateParticipant(participantId, validationResult.data);
      
      if (!updatedParticipant) {
        return res.status(404).json({ message: 'Participant not found' });
      }
      
      res.json(updatedParticipant);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update participant' });
    }
  });
  
  // Tracking
  app.get('/api/participants/:id/tracking', async (req: Request, res: Response) => {
    try {
      const participantId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const trackingPoints = await storage.getTrackingPoints(participantId, limit);
      res.json(trackingPoints);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tracking data' });
    }
  });
  
  app.post('/api/tracking', async (req: Request, res: Response) => {
    try {
      const validationResult = insertTrackingPointSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid tracking data', errors: validationResult.error.errors });
      }
      
      const trackingPoint = await storage.createTrackingPoint(validationResult.data);
      
      // Broadcast the update to WebSocket clients
      broadcastMessage({
        type: 'position_update',
        data: trackingPoint
      });
      
      res.status(201).json(trackingPoint);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create tracking point' });
    }
  });
  
  app.get('/api/events/:eventId/alerts', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const alerts = await storage.getActiveAlerts(eventId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });
  
  app.post('/api/tracking/:id/resolve-alert', async (req: Request, res: Response) => {
    try {
      const trackingPointId = parseInt(req.params.id);
      const success = await storage.resolveAlert(trackingPointId);
      
      if (!success) {
        return res.status(404).json({ message: 'Tracking point not found' });
      }
      
      // Broadcast alert resolution to WebSocket clients
      broadcastMessage({
        type: 'alert',
        data: { id: trackingPointId, resolved: true }
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to resolve alert' });
    }
  });
  
  // Devices
  app.get('/api/devices/unassigned', async (req: Request, res: Response) => {
    try {
      const devices = await storage.getUnassignedDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch unassigned devices' });
    }
  });
  
  app.get('/api/devices/type/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const devices = await storage.getDevicesByType(type);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch devices by type' });
    }
  });
  
  app.get('/api/devices', async (req: Request, res: Response) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch devices' });
    }
  });
  
  app.get('/api/devices/:id', async (req: Request, res: Response) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await storage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch device' });
    }
  });
  
  app.post('/api/devices', async (req: Request, res: Response) => {
    try {
      const validationResult = insertDeviceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid device data', errors: validationResult.error.errors });
      }
      
      const device = await storage.createDevice(validationResult.data);
      res.status(201).json(device);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create device' });
    }
  });
  
  app.put('/api/devices/:id', async (req: Request, res: Response) => {
    try {
      const deviceId = parseInt(req.params.id);
      const validationResult = insertDeviceSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid device data', errors: validationResult.error.errors });
      }
      
      const updatedDevice = await storage.updateDevice(deviceId, validationResult.data);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: 'Device not found' });
      }
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update device' });
    }
  });
  
  app.get('/api/devices/unassigned', async (req: Request, res: Response) => {
    try {
      const devices = await storage.getUnassignedDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch unassigned devices' });
    }
  });
  
  app.get('/api/devices/type/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const devices = await storage.getDevicesByType(type);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch devices by type' });
    }
  });
  
  app.get('/api/participants/:id/device', async (req: Request, res: Response) => {
    try {
      const participantId = parseInt(req.params.id);
      const device = await storage.getDeviceByParticipant(participantId);
      
      if (!device) {
        return res.status(404).json({ message: 'No device assigned to this participant' });
      }
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch participant device' });
    }
  });
  
  app.post('/api/devices/:deviceId/assign/:participantId', async (req: Request, res: Response) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const participantId = parseInt(req.params.participantId);
      
      const updatedDevice = await storage.assignDeviceToParticipant(deviceId, participantId);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: 'Device or participant not found' });
      }
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to assign device' });
    }
  });
  
  app.post('/api/devices/:deviceId/unassign', async (req: Request, res: Response) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      
      const updatedDevice = await storage.unassignDevice(deviceId);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: 'Device not found' });
      }
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to unassign device' });
    }
  });
  
  return httpServer;
}

// Function to simulate real-time tracking updates
function setupSimulatedTracking(broadcast: (message: WebSocketMessage) => void) {
  // Simulate movement for active participants
  setInterval(async () => {
    try {
      // Get active participants for event 1 (our demo event)
      const participants = await storage.getParticipantsWithTracking(1);
      const activeParticipants = participants.filter(p => p.status === 'active');
      
      for (const participant of activeParticipants) {
        if (!participant.latestPosition) continue;
        
        // Get the latest position
        const latest = participant.latestPosition;
        
        // Create a small random movement
        const latChange = (Math.random() * 0.0005) - 0.00025;
        const lngChange = (Math.random() * 0.0005) - 0.00025;
        
        const location = latest.location as any;
        
        // Update the position
        const newTrackingPoint = await storage.createTrackingPoint({
          participantId: participant.id,
          eventId: 1,
          timestamp: new Date(),
          location: { 
            lat: location.lat + latChange, 
            lng: location.lng + lngChange 
          },
          speed: Math.random() * 20,
          battery: latest.battery ? Math.max(0, Math.min(100, latest.battery - 0.1)) : 100,
          elevation: latest.elevation ? latest.elevation + (Math.random() * 2 - 1) : 100,
          hasAlert: latest.hasAlert,
          alertType: latest.alertType,
        });
        
        // Broadcast the update
        broadcast({
          type: 'position_update',
          data: newTrackingPoint
        });
      }
    } catch (error) {
      console.error('Error simulating tracking updates:', error);
    }
  }, 5000); // Update every 5 seconds
  
  // Occasionally generate random SOS alerts
  setInterval(async () => {
    try {
      // 10% chance to create an alert for a random participant
      if (Math.random() > 0.9) {
        const participants = await storage.getParticipants(1);
        const activeParticipants = participants.filter(p => p.status === 'active');
        
        if (activeParticipants.length === 0) return;
        
        // Pick a random participant
        const randomIndex = Math.floor(Math.random() * activeParticipants.length);
        const participant = activeParticipants[randomIndex];
        
        // Get their latest position
        const latestPosition = await storage.getLatestTrackingPoint(participant.id);
        
        if (!latestPosition) return;
        
        // Only create alert if they don't already have one
        if (!latestPosition.hasAlert) {
          const alertTypes = ['low-battery', 'off-course', 'sos'];
          const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          
          const location = latestPosition.location as any;
          
          // Create alert tracking point
          const alertPoint = await storage.createTrackingPoint({
            participantId: participant.id,
            eventId: 1,
            timestamp: new Date(),
            location: location,
            speed: latestPosition.speed,
            battery: latestPosition.battery,
            elevation: latestPosition.elevation,
            hasAlert: true,
            alertType,
          });
          
          // Broadcast the alert
          broadcast({
            type: 'alert',
            data: {
              participantId: participant.id,
              alertType,
              timestamp: new Date(),
              location: location,
              participantName: participant.name,
              participantNumber: participant.number,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error generating random alerts:', error);
    }
  }, 30000); // Check every 30 seconds
}
