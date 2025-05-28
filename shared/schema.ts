import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

// Device model
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // GPS, smartphone, smart watch, etc.
  serialNumber: text("serial_number").notNull().unique(),
  status: text("status").notNull().default("available"), // available, assigned, maintenance, retired
  batteryLevel: integer("battery_level"), // percentage
  lastSeen: timestamp("last_seen"),
  assignedTo: integer("assigned_to"), // participant ID if assigned
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  name: true,
  type: true,
  serialNumber: true,
  status: true,
  batteryLevel: true,
  lastSeen: true,
  assignedTo: true,
});

// Event model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed, cancelled
  routeId: integer("route_id"),
  createdBy: integer("created_by"),
  maxParticipants: integer("max_participants").default(100),
});
/*
export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  location: true,
  status: true,
  routeId: true,
  createdBy: true,
  maxParticipants: true,
});*/
export const insertEventSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  location: z.string(),
  status: z.string(),
  maxParticipants: z.number(),
  createdBy: z.number(),
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()),
});

// Route model
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  distance: real("distance").notNull(), // in kilometers
  path: jsonb("path").notNull(), // GeoJSON LineString coordinates
  createdBy: integer("created_by"),
});

export const insertRouteSchema = createInsertSchema(routes).pick({
  name: true,
  description: true,
  distance: true,
  path: true,
  createdBy: true,
});

// Checkpoint model
export const checkpoints = pgTable("checkpoints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  routeId: integer("route_id").notNull(),
  order: integer("order").notNull(),
  location: jsonb("location").notNull(), // GeoJSON Point coordinates
  radius: real("radius").notNull().default(50), // in meters
});

export const insertCheckpointSchema = createInsertSchema(checkpoints).pick({
  name: true,
  routeId: true,
  order: true,
  location: true,
  radius: true,
});

// Participant model
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(), // Bib number
  name: text("name").notNull(),
  eventId: integer("event_id").notNull(),
  status: text("status").notNull().default("registered"), // registered, active, finished, withdrawn, disqualified
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  number: true,
  name: true,
  eventId: true,
  status: true,
  emergencyContact: true,
  emergencyPhone: true,
});

// Tracking model - for storing real-time GPS positions
export const trackingPoints = pgTable("tracking_points", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull(),
  eventId: integer("event_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  location: jsonb("location").notNull(), // GeoJSON Point coordinates {lat, lng}
  speed: real("speed"), // in km/h
  battery: integer("battery"), // percentage
  elevation: real("elevation"), // in meters
  hasAlert: boolean("has_alert").default(false),
  alertType: text("alert_type"), // sos, low-battery, off-course
});

export const insertTrackingPointSchema = createInsertSchema(trackingPoints).pick({
  participantId: true,
  eventId: true,
  timestamp: true,
  location: true,
  speed: true,
  battery: true,
  elevation: true,
  hasAlert: true,
  alertType: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type Checkpoint = typeof checkpoints.$inferSelect;
export type InsertCheckpoint = z.infer<typeof insertCheckpointSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type TrackingPoint = typeof trackingPoints.$inferSelect;
export type InsertTrackingPoint = z.infer<typeof insertTrackingPointSchema>;

// Additional types for front-end use
export type ParticipantWithTracking = Participant & {
  latestPosition?: TrackingPoint;
  distance?: number;
  duration?: string;
  checkpointsCompleted?: number;
};

export type EventWithStats = Event & {
  participantCount: number;
  activeParticipants: number;
  alertsCount: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  leadParticipant?: ParticipantWithTracking;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type AlertInfo = {
  participantId: number;
  alertType: string;
  timestamp: Date;
  location: GeoPoint;
  participantName: string;
  participantNumber: number;
};

export type WebSocketMessage = {
  type: 'position_update' | 'alert' | 'event_update' | 'participant_status';
  data: any; // This will be typed based on the message type
};
