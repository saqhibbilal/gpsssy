import { GeoPoint } from "@shared/schema";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Calculate the distance between two points in kilometers using the Haversine formula
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = degToRad(point2.lat - point1.lat);
  const dLng = degToRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(point1.lat)) * Math.cos(degToRad(point2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate the center point of an array of coordinates
export function calculateCenter(points: GeoPoint[]): GeoPoint {
  if (points.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  let sumLat = 0;
  let sumLng = 0;
  
  for (const point of points) {
    sumLat += point.lat;
    sumLng += point.lng;
  }
  
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

// Calculate the bounds for an array of points
export function calculateBounds(points: GeoPoint[]): MapBounds {
  if (points.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  
  let north = points[0].lat;
  let south = points[0].lat;
  let east = points[0].lng;
  let west = points[0].lng;
  
  for (const point of points) {
    if (point.lat > north) north = point.lat;
    if (point.lat < south) south = point.lat;
    if (point.lng > east) east = point.lng;
    if (point.lng < west) west = point.lng;
  }
  
  // Add a small buffer for better visibility
  const latBuffer = (north - south) * 0.1;
  const lngBuffer = (east - west) * 0.1;
  
  return {
    north: north + latBuffer,
    south: south - latBuffer,
    east: east + lngBuffer,
    west: west - lngBuffer
  };
}

// Convert a GeoJSON LineString to an array of GeoPoints
export function geoJsonToPoints(geoJson: any): GeoPoint[] {
  if (!geoJson || !geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
    return [];
  }
  
  return geoJson.coordinates.map((coord: number[]) => ({
    lat: coord[1],
    lng: coord[0]
  }));
}

// Format coordinates in a user-friendly way
export function formatCoordinates(point: GeoPoint): string {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

// Format distance in kilometers with appropriate units
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Generate a random color for map elements
export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Check if a point is within a certain radius of another point
export function isPointInRadius(point: GeoPoint, center: GeoPoint, radiusKm: number): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}
