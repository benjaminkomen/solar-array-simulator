# Plan: Realistic Energy Production Simulation

## Current State

The production screen calculates wattage with a simple formula:
```
wattage = maxWattage × (efficiency / 100) × (0.95 + random × 0.1)
```

Compass direction is stored but **not used** in the calculation. There is no location awareness, no time-of-day variation, and no seasonal variation. The ±5% random fluctuation is the only variability.

## Factors That Affect Real Solar Output

| Factor | Impact | Source |
|--------|--------|--------|
| **Geographic latitude** | Determines sun angle and day length | User input or device GPS |
| **Compass direction (azimuth)** | How directly panels face the sun | Already stored in configStore |
| **Season / date** | Sun elevation changes throughout year | Device clock |
| **Time of day** | Sun rises, peaks at solar noon, sets | Device clock |
| **Panel tilt angle** | Angle from horizontal (affects incidence angle) | New config field |
| **Weather / cloud cover** | Reduces irradiance significantly | Optional weather API or skip |

### What to include vs. skip

**Include (deterministic, no external API needed):**
- Location (latitude/longitude)
- Compass direction (already have)
- Date (season)
- Time of day
- Panel tilt angle

**Skip for now:**
- Real-time weather/cloud cover — requires a weather API, adds complexity and cost. Instead, keep the existing ±5% random fluctuation as a simple "weather noise" stand-in.

## Implementation Plan

### Step 1: Add solar position math utility

**New file:** `src/utils/solarCalculations.ts`

Pure math functions (no React, no state). Core calculations:

1. **`getSolarPosition(lat, lon, date)`** → `{ elevation, azimuth }`
   - Uses standard solar position algorithm (solar declination, hour angle, etc.)
   - Returns sun elevation above horizon (0-90°) and azimuth (0-360°)

2. **`getIncidenceAngle(sunElevation, sunAzimuth, panelTilt, panelAzimuth)`** → `number`
   - Angle between sun rays and panel normal vector
   - Uses: `cos(θ) = sin(elevation)×cos(tilt) + cos(elevation)×sin(tilt)×cos(sunAzimuth - panelAzimuth)`

3. **`calculateIrradiance(lat, dayOfYear, sunElevation)`** → `number` (W/m²)
   - Clear-sky irradiance model (simplified)
   - Peak ~1000 W/m² at solar noon in summer at mid-latitudes
   - Accounts for atmospheric mass at low sun angles (air mass model)
   - Returns 0 when sun is below horizon

4. **`getEffectiveOutput(params)`** → `number` (watts)
   - Combines: `maxWattage × inverterEfficiency × irradianceFactor × incidenceAngleFactor × randomFluctuation`
   - `irradianceFactor` = actual irradiance / 1000 (normalized to STC)
   - `incidenceAngleFactor` = max(0, cos(incidenceAngle))
   - `randomFluctuation` = existing 0.95-1.05 noise

All functions are pure, testable, and run on the JS thread (not worklets).

### Step 2: Add location and tilt to configStore

**Modify:** `src/utils/configStore.ts`

Add new fields to `SystemConfig`:

```typescript
interface SystemConfig {
  // ... existing fields ...
  latitude: number | null;     // null = not set
  longitude: number | null;    // null = not set
  panelTiltAngle: number;      // degrees from horizontal, default 30
}
```

Add store functions:
- `updateLocation(lat, lon)`
- `updatePanelTiltAngle(degrees)`

Default tilt: 30° (common residential install angle).
Default location: `null` (prompts user to set it).

Migration: existing configs without these fields get defaults on load (same pattern already used for `compassDirection`).

### Step 3: Add location input to Config screen

**Modify:** `src/app/config.tsx`

Add a new section to the config form:

- **"Location" section** with:
  - "Use Current Location" button — calls `expo-location` to get device GPS coordinates
  - Manual latitude/longitude entry as fallback
  - Display current location as city name if possible (reverse geocode), or just lat/lon
  - **Tilt angle slider** (0-90°, default 30°)

**New dependency:** `expo-location` for GPS access.

### Step 4: Update production wattage calculation

**Modify:** `src/app/production.tsx`

Replace the current `calculateWattage` callback:

```typescript
// Before
const baseWattage = config.defaultMaxWattage * efficiency;
const fluctuation = 0.95 + Math.random() * 0.1;
return Math.round(baseWattage * fluctuation);

// After
const output = getEffectiveOutput({
  maxWattage: config.defaultMaxWattage,
  inverterEfficiency: inverter.efficiency,
  latitude: config.latitude,
  longitude: config.longitude,
  panelTilt: config.panelTiltAngle,
  panelAzimuth: config.compassDirection,
  date: new Date(),
});
return Math.round(output);
```

**Fallback:** If location is `null`, fall back to the current simple formula so the app still works without location set.

### Step 5: Add time-of-day and season visual indicators

**Modify:** `src/app/production.tsx`

Add informational display below the total output card:

- Current sun elevation and azimuth
- Day/night indicator (if sun below horizon, show "Night — 0W" for all panels)
- Sunrise/sunset times for current location and date

This is lightweight — just text display using the solar calculation utility.

### Step 6: Update CLAUDE.md

Document the new simulation system, formulas, and config fields.

## File Changes Summary

| File | Action | What |
|------|--------|------|
| `src/utils/solarCalculations.ts` | **Create** | Solar position math, irradiance model |
| `src/utils/configStore.ts` | Modify | Add latitude, longitude, panelTiltAngle fields |
| `src/hooks/useConfigStore.ts` | Modify | Expose new store functions |
| `src/app/config.tsx` | Modify | Add location section and tilt slider |
| `src/app/production.tsx` | Modify | Use realistic calculation, add sun info display |
| `CLAUDE.md` | Modify | Document new simulation system |
| `package.json` | Modify | Add `expo-location` dependency |

## Solar Math Reference

The key formula for solar panel output:

```
P = P_max × η_inverter × (G / G_STC) × max(0, cos θ_i) × noise

Where:
  P_max       = panel max wattage (e.g., 430W)
  η_inverter  = inverter efficiency (0-1)
  G           = clear-sky irradiance at current sun position (W/m²)
  G_STC       = 1000 W/m² (Standard Test Conditions)
  θ_i         = angle of incidence between sun and panel normal
  noise       = 0.95 + random(0, 0.1)  — simulates clouds/dust

Angle of incidence:
  cos(θ_i) = sin(α)×cos(β) + cos(α)×sin(β)×cos(γ_s - γ_p)

Where:
  α   = solar elevation angle
  β   = panel tilt from horizontal
  γ_s = solar azimuth
  γ_p = panel azimuth (compass direction)
```

## Scope Boundaries

**In scope:**
- Solar position calculation from lat/lon/date/time
- Panel orientation effect (azimuth + tilt)
- Seasonal and diurnal variation
- Clear-sky irradiance model
- GPS location capture
- Graceful fallback when location not set

**Out of scope (future work):**
- Real weather API integration
- Historical production data / graphs
- Shading analysis from surrounding objects
- Temperature derating
- Soiling/degradation factors
- Multi-orientation arrays (all panels share one azimuth/tilt)
