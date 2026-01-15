import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Waypoint {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface RouteMapProps {
  waypoints: Waypoint[];
  route?: {
    geometry: {
      coordinates: Array<[number, number]>;
    };
  };
  height?: string;
}

export default function RouteMap({ waypoints, route, height = '400px' }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    
    if (!mapboxToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: waypoints.length > 0 
        ? [waypoints[0].longitude, waypoints[0].latitude]
        : [-98.5795, 39.8283],
      zoom: waypoints.length > 0 ? 12 : 4,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers and route
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for waypoints
    waypoints.forEach((waypoint, index) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'waypoint-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = index === 0 ? '#2ecc71' : index === waypoints.length - 1 ? '#e74c3c' : '#3498db';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '12px';
      el.textContent = (index + 1).toString();

      new mapboxgl.Marker(el)
        .setLngLat([waypoint.longitude, waypoint.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div>
              <strong>Stop ${index + 1}</strong><br/>
              ${waypoint.address || waypoint.name || 'No address'}
            </div>`
          )
        )
        .addTo(map.current);
    });

    // Add route line if provided
    if (route && route.geometry && route.geometry.coordinates.length > 0) {
      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: route.geometry,
          properties: {},
        });
      } else {
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: route.geometry,
              properties: {},
            },
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3498db',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }

      // Fit map to route bounds
      const coordinates = route.geometry.coordinates as Array<[number, number]>;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50,
      });
    } else if (waypoints.length > 0) {
      // Fit map to waypoints
      const bounds = waypoints.reduce(
        (bounds, wp) => bounds.extend([wp.longitude, wp.latitude]),
        new mapboxgl.LngLatBounds(
          [waypoints[0].longitude, waypoints[0].latitude],
          [waypoints[0].longitude, waypoints[0].latitude]
        )
      );

      map.current.fitBounds(bounds, {
        padding: 50,
      });
    }
  }, [waypoints, route, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
