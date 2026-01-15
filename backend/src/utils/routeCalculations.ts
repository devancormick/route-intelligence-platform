import { query } from '../db/connection';

export async function calculateRouteDistance(waypoints: Array<{ latitude: number; longitude: number }>): Promise<number> {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const result = await query(
      `SELECT ST_Distance(
        ST_GeomFromText($1, 4326)::geography,
        ST_GeomFromText($2, 4326)::geography
      ) / 1000.0 as distance_km`,
      [
        `POINT(${waypoints[i].longitude} ${waypoints[i].latitude})`,
        `POINT(${waypoints[i + 1].longitude} ${waypoints[i + 1].latitude})`,
      ]
    );
    totalDistance += parseFloat(result.rows[0].distance_km);
  }

  return Math.round(totalDistance * 100) / 100;
}

export async function calculateRouteDuration(
  waypoints: Array<{ latitude: number; longitude: number; estimated_duration_minutes?: number }>,
  averageSpeedKmh: number = 50
): Promise<number> {
  if (waypoints.length < 2) return 0;

  let totalDuration = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const result = await query(
      `SELECT ST_Distance(
        ST_GeomFromText($1, 4326)::geography,
        ST_GeomFromText($2, 4326)::geography
      ) / 1000.0 as distance_km`,
      [
        `POINT(${waypoints[i].longitude} ${waypoints[i].latitude})`,
        `POINT(${waypoints[i + 1].longitude} ${waypoints[i + 1].latitude})`,
      ]
    );
    const distanceKm = parseFloat(result.rows[0].distance_km);
    const travelTimeMinutes = (distanceKm / averageSpeedKmh) * 60;
    totalDuration += travelTimeMinutes;

    // Add service time at destination
    if (waypoints[i + 1].estimated_duration_minutes) {
      totalDuration += waypoints[i + 1].estimated_duration_minutes;
    } else {
      totalDuration += 30; // Default service time
    }
  }

  return Math.round(totalDuration);
}
