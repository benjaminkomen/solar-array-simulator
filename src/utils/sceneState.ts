/**
 * Mutable scene state shared between React UI (slider) and R3F frame loop.
 * Writing to this object does NOT trigger React re-renders.
 * R3F components read from it inside useFrame callbacks.
 *
 * This is the standard R3F performance pattern for high-frequency updates
 * (e.g. slider → sun position) that would otherwise cause expensive
 * React reconciliation on every tick.
 */
import type { Season } from "@/utils/solarCalculations";

export const sceneState = {
  /** Current hour from the slider (fractional UTC hour) */
  currentHour: 12,
  /** Solar latitude in degrees */
  latitude: 52.37,
  /** Solar longitude in degrees */
  longitude: 4.9,
  /** Current season */
  season: "summer" as Season,
  /** Pre-computed sunrise hour (updated on season/location change) */
  sunriseHour: 6,
  /** Pre-computed sunset hour (updated on season/location change) */
  sunsetHour: 20,
  /** Pre-computed peak elevation for sun arc (updated on season/location change) */
  peakElevation: 60,

  /** Computed by SimulationScene's useFrame, read by SunLight/SkyDome */
  _computed: {
    sunPosition: { x: 0, y: 10, z: 25 },
    intensity: 1,
    elevation: 45,
  },
};
