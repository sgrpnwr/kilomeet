import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

export type TrackedPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

// Haversine formula — calculates straight-line distance between two GPS points
// on Earth's curved surface. This is the standard formula every fitness app uses.
function distanceBetween(a: TrackedPoint, b: TrackedPoint): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c; // distance in meters
}

export function useLocationTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<TrackedPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0); // meters
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  async function requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  const start = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      throw new Error('Location permission not granted');
    }

    setPoints([]);
    setTotalDistance(0);
    setIsTracking(true);

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000, // update every 3 seconds
        distanceInterval: 5, // or every 5 meters moved, whichever comes first
      },
      (location) => {
        const newPoint: TrackedPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };

        setPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segmentDistance = distanceBetween(last, newPoint);
            setTotalDistance((d) => d + segmentDistance);
          }
          return [...prev, newPoint];
        });
      }
    );
  }, []);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsTracking(false);
  }, []);

  return { isTracking, points, totalDistance, start, stop };
}