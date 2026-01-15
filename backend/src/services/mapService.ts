import axios from 'axios';
import { logger } from '../utils/logger';

export interface MapboxRouteResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
    };
  }>;
}

export interface GeocodeResponse {
  features: Array<{
    place_name: string;
    center: [number, number];
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

export class MapService {
  private mapboxToken: string;
  private googleMapsKey: string;

  constructor() {
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || '';
    this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  async getDirections(
    waypoints: Array<{ latitude: number; longitude: number }>,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<MapboxRouteResponse> {
    if (!this.mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const coordinates = waypoints
      .map(wp => `${wp.longitude},${wp.latitude}`)
      .join(';');

    try {
      const response = await axios.get<MapboxRouteResponse>(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`,
        {
          params: {
            access_token: this.mapboxToken,
            geometries: 'geojson',
            overview: 'full',
            steps: true,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Mapbox directions error', { error: error.message });
      throw new Error(`Failed to get directions: ${error.message}`);
    }
  }

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; formatted: string }> {
    if (!this.mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    try {
      const response = await axios.get<GeocodeResponse>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            limit: 1,
          },
        }
      );

      if (response.data.features.length === 0) {
        throw new Error('Address not found');
      }

      const feature = response.data.features[0];
      return {
        longitude: feature.center[0],
        latitude: feature.center[1],
        formatted: feature.place_name,
      };
    } catch (error: any) {
      logger.error('Geocoding error', { error: error.message });
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    if (!this.mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    try {
      const response = await axios.get<GeocodeResponse>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            limit: 1,
          },
        }
      );

      if (response.data.features.length === 0) {
        return 'Unknown location';
      }

      return response.data.features[0].place_name;
    } catch (error: any) {
      logger.error('Reverse geocoding error', { error: error.message });
      return 'Unknown location';
    }
  }

  async getIsochrones(
    center: { latitude: number; longitude: number },
    contoursMinutes: number[],
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<any> {
    if (!this.mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    try {
      const coordinates = `${center.longitude},${center.latitude}`;
      const contours = contoursMinutes.join(',');
      
      const response = await axios.get(
        `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${coordinates}`,
        {
          params: {
            access_token: this.mapboxToken,
            contours_minutes: contours,
            polygons: true,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Isochrone error', { error: error.message });
      throw new Error(`Failed to get isochrones: ${error.message}`);
    }
  }
}

export const mapService = new MapService();
