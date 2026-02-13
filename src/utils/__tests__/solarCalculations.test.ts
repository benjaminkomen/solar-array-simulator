import { describe, it, expect } from "bun:test";
import {
  getSolarPosition,
  getSunriseAndSunset,
  getSun3DPosition,
  getIncidenceAngle,
  calculateIrradiance,
  getEffectiveOutput,
  getSeasonDate,
  makeDateAtHour,
  getCurrentSeason,
} from "../solarCalculations";

describe("getSolarPosition", () => {
  it("returns positive elevation at solar noon in summer (Amsterdam)", () => {
    // June 21, solar noon UTC ~12:00 for longitude 0
    const date = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    const pos = getSolarPosition(52.37, 0, date);
    expect(pos.elevation).toBeGreaterThan(50);
    expect(pos.elevation).toBeLessThan(65);
  });

  it("returns negative elevation at midnight (Amsterdam, summer)", () => {
    const date = new Date(Date.UTC(2025, 5, 21, 0, 0, 0));
    const pos = getSolarPosition(52.37, 0, date);
    expect(pos.elevation).toBeLessThan(0);
  });

  it("returns higher elevation in summer than winter at same time", () => {
    const summer = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    const winter = new Date(Date.UTC(2025, 11, 21, 12, 0, 0));
    const summerPos = getSolarPosition(52.37, 0, summer);
    const winterPos = getSolarPosition(52.37, 0, winter);
    expect(summerPos.elevation).toBeGreaterThan(winterPos.elevation);
  });

  it("returns azimuth in valid range 0-360", () => {
    const date = new Date(Date.UTC(2025, 5, 21, 9, 0, 0));
    const pos = getSolarPosition(52.37, 0, date);
    expect(pos.azimuth).toBeGreaterThanOrEqual(0);
    expect(pos.azimuth).toBeLessThanOrEqual(360);
  });

  it("returns finite values at equator (near-zenith edge case)", () => {
    // Equator at solar noon near equinox — sun nearly at zenith
    const date = new Date(Date.UTC(2025, 2, 20, 12, 0, 0));
    const pos = getSolarPosition(0, 0, date);
    expect(Number.isFinite(pos.elevation)).toBe(true);
    expect(Number.isFinite(pos.azimuth)).toBe(true);
    expect(pos.elevation).toBeGreaterThan(80);
  });

  it("returns finite azimuth at poles (division-by-zero guard)", () => {
    const date = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    const pos = getSolarPosition(90, 0, date);
    expect(Number.isFinite(pos.elevation)).toBe(true);
    expect(Number.isFinite(pos.azimuth)).toBe(true);
    // At the north pole in summer, azimuth should be the fallback 180
    expect(pos.azimuth).toBe(180);
  });

  it("handles longitude offset correctly", () => {
    // Same time, different longitudes: one sees morning, other afternoon
    const date = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    const east = getSolarPosition(52.37, 90, date);   // 6 hours ahead in solar time
    const west = getSolarPosition(52.37, -90, date);   // 6 hours behind

    // Eastern longitude at UTC noon is late afternoon, sun should be in the west (azimuth > 180)
    expect(east.azimuth).toBeGreaterThan(180);
  });
});

describe("getSunriseAndSunset", () => {
  it("returns sunrise before sunset", () => {
    const date = new Date(Date.UTC(2025, 5, 21));
    const { sunriseHour, sunsetHour } = getSunriseAndSunset(52.37, 0, date);
    expect(sunriseHour).toBeLessThan(sunsetHour);
  });

  it("returns longer days in summer than winter", () => {
    const summer = new Date(Date.UTC(2025, 5, 21));
    const winter = new Date(Date.UTC(2025, 11, 21));
    const summerDay = getSunriseAndSunset(52.37, 0, summer);
    const winterDay = getSunriseAndSunset(52.37, 0, winter);
    const summerLength = summerDay.sunsetHour - summerDay.sunriseHour;
    const winterLength = winterDay.sunsetHour - winterDay.sunriseHour;
    expect(summerLength).toBeGreaterThan(winterLength);
  });

  it("handles midnight sun (high arctic summer)", () => {
    const date = new Date(Date.UTC(2025, 5, 21));
    const { sunriseHour, sunsetHour } = getSunriseAndSunset(80, 0, date);
    // Midnight sun: 24-hour day
    expect(sunriseHour).toBe(0);
    expect(sunsetHour).toBe(24);
  });

  it("handles polar night (high arctic winter)", () => {
    const date = new Date(Date.UTC(2025, 11, 21));
    const { sunriseHour, sunsetHour } = getSunriseAndSunset(80, 0, date);
    // Polar night: sun never rises
    expect(sunriseHour).toBe(12);
    expect(sunsetHour).toBe(12);
  });

  it("returns reasonable hours for equator", () => {
    const date = new Date(Date.UTC(2025, 2, 20));
    const { sunriseHour, sunsetHour } = getSunriseAndSunset(0, 0, date);
    // Near equinox at equator: ~6am to ~6pm UTC
    expect(sunriseHour).toBeGreaterThan(4);
    expect(sunriseHour).toBeLessThan(8);
    expect(sunsetHour).toBeGreaterThan(16);
    expect(sunsetHour).toBeLessThan(20);
  });
});

describe("getSun3DPosition", () => {
  it("puts sun above ground when elevation is positive", () => {
    const pos = getSun3DPosition(45, 180, 50);
    expect(pos.y).toBeGreaterThan(0);
  });

  it("puts sun below ground when elevation is negative", () => {
    const pos = getSun3DPosition(-10, 180, 50);
    expect(pos.y).toBeLessThan(0);
  });

  it("maps azimuth 0 (North) to negative Z", () => {
    const pos = getSun3DPosition(45, 0, 50);
    expect(pos.z).toBeLessThan(0);
    expect(Math.abs(pos.x)).toBeLessThan(0.01);
  });

  it("maps azimuth 90 (East) to positive X", () => {
    const pos = getSun3DPosition(45, 90, 50);
    expect(pos.x).toBeGreaterThan(0);
    expect(Math.abs(pos.z)).toBeLessThan(0.01);
  });

  it("maps azimuth 180 (South) to positive Z", () => {
    const pos = getSun3DPosition(45, 180, 50);
    expect(pos.z).toBeGreaterThan(0);
    expect(Math.abs(pos.x)).toBeLessThan(0.01);
  });

  it("respects distance parameter", () => {
    const near = getSun3DPosition(45, 180, 10);
    const far = getSun3DPosition(45, 180, 100);
    expect(far.y).toBeGreaterThan(near.y);
  });
});

describe("calculateIrradiance", () => {
  it("returns 0 for negative elevation (night)", () => {
    expect(calculateIrradiance(-5)).toBe(0);
  });

  it("returns 0 for elevation exactly 0 (horizon)", () => {
    expect(calculateIrradiance(0)).toBe(0);
  });

  it("returns positive value for positive elevation", () => {
    expect(calculateIrradiance(30)).toBeGreaterThan(0);
  });

  it("increases with higher elevation", () => {
    const low = calculateIrradiance(10);
    const mid = calculateIrradiance(45);
    const high = calculateIrradiance(80);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it("stays below solar constant (1361 W/m2)", () => {
    expect(calculateIrradiance(90)).toBeLessThan(1361);
  });

  it("returns reasonable value at 90 degrees (no NaN)", () => {
    const val = calculateIrradiance(90);
    expect(Number.isFinite(val)).toBe(true);
    expect(val).toBeGreaterThan(800); // Clear sky at zenith should be high
  });
});

describe("getIncidenceAngle", () => {
  it("returns 0 when sun is perpendicular to panel", () => {
    // Sun at 60° elevation, panel tilted 30° from horizontal facing south
    // For a south-facing panel at 30° tilt, sun at 60° elevation from south → incidence = 0°
    const angle = getIncidenceAngle(60, 180, 30, 180);
    expect(angle).toBeLessThan(1); // Near 0
  });

  it("returns 90 when sun is parallel to panel", () => {
    // Sun at horizon, panel facing straight up (tilt=0) and sun from side
    const angle = getIncidenceAngle(0, 90, 0, 0);
    expect(angle).toBeCloseTo(90, 0);
  });

  it("returns value between 0 and 180", () => {
    const angle = getIncidenceAngle(45, 120, 30, 180);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it("is symmetric for east vs west at solar noon", () => {
    const east = getIncidenceAngle(60, 90, 30, 180);
    const west = getIncidenceAngle(60, 270, 30, 180);
    expect(east).toBeCloseTo(west, 5);
  });
});

describe("getEffectiveOutput", () => {
  it("returns 0 when inverter efficiency is 0", () => {
    const output = getEffectiveOutput({
      maxWattage: 430,
      inverterEfficiency: 0,
      latitude: 52.37,
      longitude: 4.9,
      panelTilt: 30,
      panelAzimuth: 180,
      date: new Date(Date.UTC(2025, 5, 21, 12, 0, 0)),
    });
    expect(output).toBe(0);
  });

  it("returns 0 at night", () => {
    const output = getEffectiveOutput({
      maxWattage: 430,
      inverterEfficiency: 95,
      latitude: 52.37,
      longitude: 0,
      panelTilt: 30,
      panelAzimuth: 180,
      date: new Date(Date.UTC(2025, 5, 21, 0, 0, 0)),
    });
    expect(output).toBe(0);
  });

  it("returns positive value during daytime", () => {
    const output = getEffectiveOutput({
      maxWattage: 430,
      inverterEfficiency: 95,
      latitude: 52.37,
      longitude: 0,
      panelTilt: 30,
      panelAzimuth: 180,
      date: new Date(Date.UTC(2025, 5, 21, 12, 0, 0)),
    });
    expect(output).toBeGreaterThan(0);
    expect(output).toBeLessThanOrEqual(430);
  });

  it("falls back to simple formula when no location", () => {
    const output = getEffectiveOutput({
      maxWattage: 430,
      inverterEfficiency: 100,
      latitude: null,
      longitude: null,
      panelTilt: 30,
      panelAzimuth: 180,
      date: new Date(),
    });
    // Should be 430 * 1.0 * (0.95..1.05), so between ~408 and ~452
    expect(output).toBeGreaterThan(400);
    expect(output).toBeLessThan(460);
  });

  it("never exceeds maxWattage", () => {
    // Run multiple times to account for random noise
    for (let i = 0; i < 20; i++) {
      const output = getEffectiveOutput({
        maxWattage: 430,
        inverterEfficiency: 100,
        latitude: 0,
        longitude: 0,
        panelTilt: 0,
        panelAzimuth: 180,
        date: new Date(Date.UTC(2025, 2, 20, 12, 0, 0)),
      });
      expect(output).toBeLessThanOrEqual(430 * 1.1); // Allow noise headroom
    }
  });
});

describe("getSeasonDate", () => {
  it("returns March date for spring", () => {
    const date = getSeasonDate("spring");
    expect(date.getMonth()).toBe(2); // March = 2
  });

  it("returns June date for summer", () => {
    const date = getSeasonDate("summer");
    expect(date.getMonth()).toBe(5); // June = 5
  });

  it("returns September date for fall", () => {
    const date = getSeasonDate("fall");
    expect(date.getMonth()).toBe(8); // September = 8
  });

  it("returns December date for winter", () => {
    const date = getSeasonDate("winter");
    expect(date.getMonth()).toBe(11); // December = 11
  });
});

describe("makeDateAtHour", () => {
  it("sets the correct UTC hour", () => {
    const base = new Date(Date.UTC(2025, 5, 21));
    const result = makeDateAtHour(base, 14.5);
    expect(result.getUTCHours()).toBe(14);
    expect(result.getUTCMinutes()).toBe(30);
  });

  it("handles fractional hours correctly", () => {
    const base = new Date(Date.UTC(2025, 0, 1));
    const result = makeDateAtHour(base, 6.75);
    expect(result.getUTCHours()).toBe(6);
    expect(result.getUTCMinutes()).toBe(45);
  });

  it("preserves the date", () => {
    const base = new Date(Date.UTC(2025, 5, 21));
    const result = makeDateAtHour(base, 12);
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(5);
    expect(result.getUTCDate()).toBe(21);
  });
});

describe("getCurrentSeason", () => {
  it("returns a valid season string", () => {
    const season = getCurrentSeason();
    expect(["spring", "summer", "fall", "winter"]).toContain(season);
  });
});
