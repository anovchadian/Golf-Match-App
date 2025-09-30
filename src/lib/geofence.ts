/**
 * Geofence utilities using Haversine formula
 */

const EARTH_RADIUS_METERS = 6371000;
const COURSE_RADIUS_METERS = 500; // 500m radius for check-in

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function isWithinGeofence(
  userLat: number,
  userLng: number,
  courseLat: number,
  courseLng: number
): boolean {
  const distance = calculateDistance(userLat, userLng, courseLat, courseLng);
  return distance <= COURSE_RADIUS_METERS;
}

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}