import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../middleware/errorHandler';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/json',
      'application/gpx+xml',
      'application/xml',
      'text/xml',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(csv|json|gpx|geojson)$/i)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only CSV, JSON, GPX, and GeoJSON files are allowed', 400));
    }
  },
});

export interface ParsedWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  service_type?: string;
  estimated_duration_minutes?: number;
  name?: string;
}

export async function parseRouteFile(file: Express.Multer.File): Promise<ParsedWaypoint[]> {
  const filename = file.originalname.toLowerCase();
  const buffer = file.buffer;

  try {
    if (filename.endsWith('.csv')) {
      return parseCSV(buffer);
    } else if (filename.endsWith('.json') || filename.endsWith('.geojson')) {
      return parseGeoJSON(buffer);
    } else if (filename.endsWith('.gpx')) {
      return parseGPX(buffer);
    } else {
      throw new AppError('Unsupported file format', 400);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
  }
}

function parseCSV(buffer: Buffer): ParsedWaypoint[] {
  const content = buffer.toString('utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record: any) => {
    const lat = parseFloat(record.latitude || record.lat || record.y);
    const lng = parseFloat(record.longitude || record.lng || record.lon || record.x);

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError('Invalid coordinates in CSV file', 400);
    }

    return {
      latitude: lat,
      longitude: lng,
      address: record.address || record.Address || undefined,
      service_type: record.service_type || record.serviceType || record.type || undefined,
      estimated_duration_minutes: record.duration
        ? parseInt(record.duration, 10)
        : undefined,
      name: record.name || record.Name || undefined,
    };
  });
}

function parseGeoJSON(buffer: Buffer): ParsedWaypoint[] {
  const content = JSON.parse(buffer.toString('utf-8'));

  if (content.type === 'FeatureCollection' && content.features) {
    return content.features.map((feature: any) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) {
        throw new AppError('Invalid GeoJSON coordinates', 400);
      }

      return {
        longitude: coords[0],
        latitude: coords[1],
        address: feature.properties?.address || feature.properties?.name,
        service_type: feature.properties?.service_type || feature.properties?.type,
        estimated_duration_minutes: feature.properties?.duration
          ? parseInt(feature.properties.duration, 10)
          : undefined,
        name: feature.properties?.name,
      };
    });
  } else if (content.type === 'Feature' && content.geometry) {
    const coords = content.geometry.coordinates;
    return [{
      longitude: coords[0],
      latitude: coords[1],
      address: content.properties?.address,
      service_type: content.properties?.service_type,
      estimated_duration_minutes: content.properties?.duration
        ? parseInt(content.properties.duration, 10)
        : undefined,
    }];
  }

  throw new AppError('Invalid GeoJSON format', 400);
}

async function parseGPX(buffer: Buffer): Promise<ParsedWaypoint[]> {
  const content = buffer.toString('utf-8');
  const parsed = await parseXML(content);

  const waypoints: ParsedWaypoint[] = [];

  if (parsed.gpx?.wpt) {
    for (const wpt of parsed.gpx.wpt) {
      const lat = parseFloat(wpt.$.lat);
      const lng = parseFloat(wpt.$.lon);

      if (isNaN(lat) || isNaN(lng)) {
        continue;
      }

      waypoints.push({
        latitude: lat,
        longitude: lng,
        name: wpt.name?.[0] || wpt.cmt?.[0],
        address: wpt.desc?.[0],
      });
    }
  }

  if (parsed.gpx?.trk) {
    for (const trk of parsed.gpx.trk) {
      if (trk.trkseg) {
        for (const seg of trk.trkseg) {
          if (seg.trkpt) {
            for (const pt of seg.trkpt) {
              const lat = parseFloat(pt.$.lat);
              const lng = parseFloat(pt.$.lon);
              if (!isNaN(lat) && !isNaN(lng)) {
                waypoints.push({
                  latitude: lat,
                  longitude: lng,
                  name: pt.name?.[0],
                });
              }
            }
          }
        }
      }
    }
  }

  if (waypoints.length === 0) {
    throw new AppError('No valid waypoints found in GPX file', 400);
  }

  return waypoints;
}
