/**
 * Solar position and energy output calculations.
 * All angles in degrees unless noted. Pure math, no React dependencies.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export type Season = "spring" | "summer" | "fall" | "winter";

/** Representative day-of-year for each season */
const SEASON_DAY: Record<Season, number> = {
  spring: 79, // March 20
  summer: 172, // June 21
  fall: 265, // September 22
  winter: 355, // December 21
};

/** Get current season based on month */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/** Get representative date for a season */
export function getSeasonDate(season: Season): Date {
  const dayOfYear = SEASON_DAY[season];
  const date = new Date(new Date().getFullYear(), 0, 1);
  date.setDate(dayOfYear);
  return date;
}

export interface SolarPosition {
  /** Degrees above horizon (negative = below) */
  elevation: number;
  /** Degrees from north, clockwise (0=N, 90=E, 180=S, 270=W) */
  azimuth: number;
}

/**
 * Calculate solar declination angle for a given day of year.
 * Uses Spencer's formula approximation.
 */
function getSolarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81)) * DEG_TO_RAD);
}

/**
 * Calculate the equation of time correction in minutes.
 */
function getEquationOfTime(dayOfYear: number): number {
  const B = ((360 / 365) * (dayOfYear - 81)) * DEG_TO_RAD;
  return (
    9.87 * Math.sin(2 * B) -
    7.53 * Math.cos(B) -
    1.5 * Math.sin(B)
  );
}

/**
 * Get solar position (elevation & azimuth) for a given location and time.
 */
export function getSolarPosition(
  latitude: number,
  longitude: number,
  date: Date
): SolarPosition {
  const dayOfYear = getDayOfYear(date);
  const declination = getSolarDeclination(dayOfYear);

  // Solar time
  const eot = getEquationOfTime(dayOfYear);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const solarTime = utcHours + longitude / 15 + eot / 60;

  // Hour angle: 0 at solar noon, negative morning, positive afternoon
  const hourAngle = (solarTime - 12) * 15;

  const latRad = latitude * DEG_TO_RAD;
  const declRad = declination * DEG_TO_RAD;
  const haRad = hourAngle * DEG_TO_RAD;

  // Solar elevation
  const sinElevation =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);
  const elevation = Math.asin(sinElevation) * RAD_TO_DEG;

  // Solar azimuth
  const cosAzimuth =
    (Math.sin(declRad) - Math.sin(latRad) * sinElevation) /
    (Math.cos(latRad) * Math.cos(elevation * DEG_TO_RAD));

  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * RAD_TO_DEG;
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }

  return { elevation, azimuth };
}

/**
 * Calculate sunrise and sunset times for a given location and day.
 * Returns hours in UTC.
 */
export function getSunriseAndSunset(
  latitude: number,
  longitude: number,
  date: Date
): { sunriseHour: number; sunsetHour: number } {
  const dayOfYear = getDayOfYear(date);
  const declination = getSolarDeclination(dayOfYear);
  const eot = getEquationOfTime(dayOfYear);

  const latRad = latitude * DEG_TO_RAD;
  const declRad = declination * DEG_TO_RAD;

  // Hour angle at sunrise/sunset (when elevation = 0)
  const cosHa = -Math.tan(latRad) * Math.tan(declRad);

  // Handle polar day/night
  if (cosHa < -1) {
    // Midnight sun — sun never sets
    return { sunriseHour: 0, sunsetHour: 24 };
  }
  if (cosHa > 1) {
    // Polar night — sun never rises
    return { sunriseHour: 12, sunsetHour: 12 };
  }

  const haHours = (Math.acos(cosHa) * RAD_TO_DEG) / 15;
  const solarNoon = 12 - longitude / 15 - eot / 60;

  return {
    sunriseHour: solarNoon - haHours,
    sunsetHour: solarNoon + haHours,
  };
}

/**
 * Convert solar position to 3D world coordinates.
 * Three.js coordinate system: Y is up, XZ is the ground plane.
 * Azimuth 0 (North) maps to -Z, 90 (East) maps to +X.
 */
export function getSun3DPosition(
  elevation: number,
  azimuth: number,
  distance: number = 50
): { x: number; y: number; z: number } {
  const elevRad = elevation * DEG_TO_RAD;
  const azRad = azimuth * DEG_TO_RAD;

  const y = distance * Math.sin(elevRad);
  const horizontal = distance * Math.cos(elevRad);
  const x = horizontal * Math.sin(azRad);
  const z = -horizontal * Math.cos(azRad);

  return { x, y, z };
}

/**
 * Calculate angle of incidence between sun and panel normal.
 * Returns angle in degrees (0 = sun perpendicular to panel, 90 = parallel).
 */
export function getIncidenceAngle(
  sunElevation: number,
  sunAzimuth: number,
  panelTilt: number,
  panelAzimuth: number
): number {
  const alpha = sunElevation * DEG_TO_RAD;
  const beta = panelTilt * DEG_TO_RAD;
  const gammaS = sunAzimuth * DEG_TO_RAD;
  const gammaP = panelAzimuth * DEG_TO_RAD;

  const cosIncidence =
    Math.sin(alpha) * Math.cos(beta) +
    Math.cos(alpha) * Math.sin(beta) * Math.cos(gammaS - gammaP);

  return Math.acos(Math.max(-1, Math.min(1, cosIncidence))) * RAD_TO_DEG;
}

/**
 * Calculate clear-sky irradiance using simplified Kasten model.
 * Returns W/m² on a surface perpendicular to sun rays.
 */
export function calculateIrradiance(sunElevation: number): number {
  if (sunElevation <= 0) return 0;

  const elevRad = sunElevation * DEG_TO_RAD;
  // Air mass approximation (Kasten & Young)
  const airMass = 1 / Math.max(Math.sin(elevRad), 0.01);
  // Clear-sky direct normal irradiance
  return 1361 * Math.pow(0.7, Math.pow(airMass, 0.678));
}

/**
 * Calculate effective power output for a single panel.
 */
export function getEffectiveOutput(params: {
  maxWattage: number;
  inverterEfficiency: number; // 0-100
  latitude: number | null;
  longitude: number | null;
  panelTilt: number;
  panelAzimuth: number;
  date: Date;
}): number {
  const {
    maxWattage,
    inverterEfficiency,
    latitude,
    longitude,
    panelTilt,
    panelAzimuth,
    date,
  } = params;

  const efficiency = inverterEfficiency / 100;

  // Fallback to simple formula if no location
  if (latitude === null || longitude === null) {
    const fluctuation = 0.95 + Math.random() * 0.1;
    return maxWattage * efficiency * fluctuation;
  }

  const sun = getSolarPosition(latitude, longitude, date);

  // Night time
  if (sun.elevation <= 0) return 0;

  const irradiance = calculateIrradiance(sun.elevation);
  const irradianceFactor = irradiance / 1000; // Normalize to STC (1000 W/m²)

  const incidenceAngle = getIncidenceAngle(
    sun.elevation,
    sun.azimuth,
    panelTilt,
    panelAzimuth
  );
  const incidenceFactor = Math.max(0, Math.cos(incidenceAngle * DEG_TO_RAD));

  // ±5% random fluctuation (weather/dust noise)
  const noise = 0.95 + Math.random() * 0.1;

  return maxWattage * efficiency * irradianceFactor * incidenceFactor * noise;
}

/**
 * Build a date for a specific hour (fractional) on a given season date.
 * The hour is in UTC.
 */
export function makeDateAtHour(seasonDate: Date, utcHour: number): Date {
  const d = new Date(seasonDate);
  const hours = Math.floor(utcHour);
  const minutes = Math.floor((utcHour - hours) * 60);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
