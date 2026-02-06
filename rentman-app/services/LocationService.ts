import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '@/lib/supabase';

const LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      console.log('Background location update:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
      });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('humans')
            .update({
              last_location: {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              },
              last_location_updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      } catch (err) {
        console.error('Failed to update location:', err);
      }
    }
  }
});

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    console.warn('Foreground location permission denied');
    return false;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  if (backgroundStatus !== 'granted') {
    console.warn('Background location permission denied');
    return false;
  }

  return true;
}

export async function startLocationTracking(): Promise<boolean> {
  try {
    const hasPermissions = await requestLocationPermissions();
    if (!hasPermissions) {
      return false;
    }

    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isTaskRegistered) {
      console.log('Location tracking already active');
      return true;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 50,
      foregroundService: {
        notificationTitle: 'Rentman Mission Active',
        notificationBody: 'Tracking your location for mission completion',
        notificationColor: '#00ff88',
      },
      showsBackgroundLocationIndicator: true,
    });

    console.log('Location tracking started');
    return true;
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    return false;
  }
}

export async function stopLocationTracking(): Promise<void> {
  try {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log('Location tracking stopped');
    }
  } catch (error) {
    console.error('Failed to stop location tracking:', error);
  }
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
}

export async function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
