# Plan: 3D Solar Energy Simulation Screen

## Overview

New **Simulation screen** accessible from the Production screen. Features a 3D view of the roof with solar panels, a movable sun, and a time-of-day slider. As the user scrubs through the day, the sun moves across the sky, lighting changes on the 3D roof, and per-panel wattage output updates in real time.

**3D stack:** WebGPU via `react-native-wgpu` + `three` (WebGPU build) + `@react-three/fiber`

## User Experience

1. From Production screen, tap "Simulate" button → navigates to Simulation screen
2. Screen shows:
   - **3D view** filling most of the screen: roof + solar panels + sun
   - **Time slider** at bottom: scrub from sunrise → sunset
   - **Date picker** (or season selector): change the day of year
   - **Total output label**: updates as slider moves
   - **Per-panel wattage**: shown as floating labels or color intensity on panels
3. User drags the time slider → sun moves across the 3D sky → shadows shift → panel output changes
4. User can orbit/rotate the 3D camera with touch gestures to view from different angles

## Architecture

```
┌──────────────────────────────────────────┐
│  Simulation Screen (src/app/simulation.tsx) │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  FiberCanvas (WebGPU + R3F)       │  │
│  │                                    │  │
│  │  ┌─────────┐  ┌─────────────────┐ │  │
│  │  │  Sun    │  │  RoofModel      │ │  │
│  │  │ (light) │  │  + PanelMeshes  │ │  │
│  │  └─────────┘  └─────────────────┘ │  │
│  │                                    │  │
│  │  OrbitControls (touch to rotate)  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Time Slider: sunrise ←──●──→ sunset │  │
│  │  Date: [Season picker]              │  │
│  │  Total: 3,240W                      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Install WebGPU + Three.js dependencies

**New dependencies:**
```json
{
  "react-native-wgpu": "^0.4.1",
  "three": "0.172.0",
  "@react-three/fiber": "^9.4.0",
  "wgpu-matrix": "^3.0.2",
  "@types/three": "0.172.0"
}
```

**New file:** `metro.config.js` — resolver to route `three` → `three/webgpu` and fix R3F imports for native.

**Note:** WebGPU requires a dev build (already the workflow for this project). Does NOT work in Expo Go.

### Step 2: Create R3F lib files

Following the Expo WebGPU skill exactly:

- **`src/lib/make-webgpu-renderer.ts`** — ReactNativeCanvas wrapper + WebGPU renderer factory
- **`src/lib/fiber-canvas.tsx`** — FiberCanvas component that initializes WebGPU context, extends THREE namespace, configures R3F root
- **`src/lib/orbit-controls.tsx`** — Touch orbit controls for camera rotation

The `extend()` call needs these THREE components at minimum:
- AmbientLight, DirectionalLight
- Mesh, Group
- BoxGeometry, PlaneGeometry, CylinderGeometry
- MeshStandardMaterial, MeshBasicMaterial
- PerspectiveCamera, Scene

### Step 3: Solar position math utility

**New file:** `src/utils/solarCalculations.ts`

Pure math, no React. Functions:

1. **`getSolarPosition(lat, lon, date)`** → `{ elevation, azimuth }`
   - Solar declination, hour angle, elevation, azimuth
   - Returns sun elevation (degrees above horizon) and azimuth (0-360°)

2. **`getSunriseAndSunset(lat, lon, date)`** → `{ sunrise: Date, sunset: Date }`
   - For the time slider range

3. **`getSun3DPosition(elevation, azimuth, distance)`** → `{ x, y, z }`
   - Converts solar position to Three.js world coordinates
   - Used to position the directional light (sun)

4. **`getIncidenceAngle(sunElevation, sunAzimuth, panelTilt, panelAzimuth)`** → `number`
   - Angle between sun rays and panel normal

5. **`calculateIrradiance(sunElevation)`** → `number` (W/m²)
   - Clear-sky model, 0 when sun below horizon, peak ~1000 W/m²

6. **`getEffectiveOutput(params)`** → `number` (watts per panel)
   - `maxWattage × efficiency × (irradiance/1000) × max(0, cos(incidenceAngle)) × noise`
   - Fallback to simple formula if location not set

### Step 4: Add location, tilt, and roof type to configStore

**Modify:** `src/utils/configStore.ts`

```typescript
type RoofType = 'flat' | 'gable' | 'hip' | 'shed';

interface SystemConfig {
  // ... existing fields ...
  latitude: number | null;
  longitude: number | null;
  panelTiltAngle: number;      // default 30°
  roofType: RoofType;          // default 'gable'
}
```

Store functions:
- `updateLocation(lat, lon)`
- `updatePanelTiltAngle(degrees)`
- `updateRoofType(type)`

**New dependency:** `expo-location` for GPS.

### Step 5: Add location & roof config to Config screen

**Modify:** `src/app/config.tsx`

New form sections:
- **"Location" section**: "Use Current Location" button + manual lat/lon fallback
- **"Roof Type" section**: Picker/segmented control with flat/gable/hip/shed options (with small illustrations or labels)
- **"Panel Tilt" section**: Slider 0-90°, default 30°

### Step 6: Create 3D roof + panel components

**New file:** `src/components/simulation/RoofModel.tsx`

3D roof geometry based on `roofType`:

| Roof Type | Geometry | Description |
|-----------|----------|-------------|
| **Flat** | Single tilted plane | Simple rectangle at tilt angle |
| **Gable** | Two planes meeting at ridge | Classic A-frame, ridge runs along length |
| **Hip** | Four sloping planes | Ridge with sloped ends |
| **Shed** | Single plane, one-direction slope | Lean-to style, slope one way |

The roof dimensions derive from the panel layout bounding box (with some padding). Panels sit on the roof surface.

**New file:** `src/components/simulation/PanelMesh.tsx`

Each panel rendered as a slightly raised box on the roof surface:
- Blue-tinted when producing, darker when low output
- Opacity/color intensity maps to current wattage
- Positioned to match the 2D layout (x,y mapped to roof surface coordinates)

**New file:** `src/components/simulation/SunLight.tsx`

Directional light representing the sun:
- Position driven by `getSun3DPosition(elevation, azimuth)`
- Intensity proportional to irradiance
- Casts shadows onto roof
- Visual sun sphere (small yellow emissive sphere at light position)

### Step 7: Create the Simulation screen

**New file:** `src/app/simulation.tsx`

Screen composition:
1. **FiberCanvas** (lazy-loaded for bundle splitting):
   - Camera: PerspectiveCamera, starts at 45° overhead angle
   - OrbitControls: touch to rotate/zoom the view
   - Scene contents: RoofModel + PanelMeshes + SunLight + AmbientLight
   - Ground plane (subtle grid or flat surface below roof)
2. **Time slider** (React Native, overlay at bottom):
   - Range: sunrise → sunset for the selected date/location
   - Drives `currentTime` state → recalculates sun position → updates light + wattages
   - Shows formatted time label (e.g., "2:30 PM")
3. **Season/date control**:
   - Four season buttons (Winter/Spring/Summer/Fall) that set representative dates
   - Or a date picker for exact date
4. **Output display**:
   - Total array output label, updates as slider moves
   - Optionally per-panel floating labels in 3D (or just color intensity)

**Navigation:** Accessible from Production screen via toolbar button or menu item.

### Step 8: Update Production screen wattage calculation

**Modify:** `src/app/production.tsx`

Replace the simple formula with `getEffectiveOutput()` using the current real time. The existing 1-second interval now shows realistic output that changes throughout the day.

Fallback: if `latitude` is null, keep the old formula.

### Step 9: Wire up navigation

**Modify:** `src/app/production.tsx`

Add "Simulate" button to the production screen (toolbar or header). Navigates to `/simulation`.

### Step 10: Update CLAUDE.md

Document the simulation screen, 3D setup, and new config fields.

## File Changes Summary

| File | Action | What |
|------|--------|------|
| `package.json` | Modify | Add react-native-wgpu, three, @react-three/fiber, wgpu-matrix, expo-location |
| `metro.config.js` | **Create** | Three.js WebGPU resolver + R3F native fix |
| `src/lib/make-webgpu-renderer.ts` | **Create** | WebGPU renderer factory (from Expo skill) |
| `src/lib/fiber-canvas.tsx` | **Create** | FiberCanvas R3F wrapper (from Expo skill) |
| `src/lib/orbit-controls.tsx` | **Create** | Touch orbit camera controls |
| `src/utils/solarCalculations.ts` | **Create** | Solar position math, irradiance, output formulas |
| `src/utils/configStore.ts` | Modify | Add latitude, longitude, panelTiltAngle, roofType |
| `src/hooks/useConfigStore.ts` | Modify | Expose new store functions |
| `src/app/config.tsx` | Modify | Add location, roof type, tilt angle sections |
| `src/components/simulation/RoofModel.tsx` | **Create** | 3D roof geometry (flat/gable/hip/shed) |
| `src/components/simulation/PanelMesh.tsx` | **Create** | 3D panel on roof surface with wattage coloring |
| `src/components/simulation/SunLight.tsx` | **Create** | Directional light + sun sphere driven by time |
| `src/app/simulation.tsx` | **Create** | Simulation screen with 3D view + time slider |
| `src/app/production.tsx` | Modify | Add Simulate button, use realistic wattage calc |
| `CLAUDE.md` | Modify | Document simulation system |

## 3D Scene Details

### Coordinate System
- Three.js Y-up: Y is vertical, XZ is the ground plane
- Roof sits above Y=0 ground plane
- Sun orbits in a hemisphere above the scene
- Panel 2D layout (x, y) maps to roof surface (x → X, y → Z on roof slope)

### Roof Geometry Detail

**Gable (most common):**
```
        /\
       /  \
      /    \
     /      \
    /________\
```
- Two PlaneGeometry surfaces angled to meet at ridge
- Ridge height = `roofWidth/2 × tan(tiltAngle)`
- Panels placed on south-facing slope (or slope matching compass direction)

**Hip:**
```
     ____
    /    \
   /      \
  /________\
```
- Four sloped planes, ridge shorter than base
- More complex but still constructible from PlaneGeometry + transforms

**Flat:** Single horizontal plane (or very slight tilt)

**Shed:** Single plane tilted in one direction

### Sun Movement
- Sun position calculated from `getSun3DPosition()` at distance ~50 units
- DirectionalLight pointed at scene center
- As time slider moves: light position updates → shadows shift → panel colors change
- Below horizon (before sunrise / after sunset): minimal ambient only, all panels at 0W

### Performance Considerations
- Lazy-load the simulation screen (React.lazy) so Three.js doesn't bloat initial load
- Roof + panels are simple geometry (low poly count)
- Shadow map only from the single directional light (sun)
- Panel wattage recalculated only on slider change, not every frame

## Solar Math Reference

```
P = P_max × η_inverter × (G / 1000) × max(0, cos θ_i) × noise

Sun position:
  declination = 23.45° × sin(360/365 × (dayOfYear - 81))
  hourAngle = 15° × (solarHour - 12)
  elevation = arcsin(sin(lat)×sin(decl) + cos(lat)×cos(decl)×cos(hourAngle))
  azimuth = arctan2(-cos(decl)×sin(hourAngle), cos(lat)×sin(decl) - sin(lat)×cos(decl)×cos(hourAngle))

Angle of incidence:
  cos(θ_i) = sin(α)×cos(β) + cos(α)×sin(β)×cos(γ_s - γ_p)
  α = solar elevation, β = panel tilt, γ_s = sun azimuth, γ_p = panel azimuth

Clear-sky irradiance:
  airMass = 1 / max(sin(elevation), 0.01)
  G = 1361 × 0.7^(airMass^0.678)  (simplified Kasten model)
```

## Scope Boundaries

**In scope:**
- 3D roof visualization with 4 roof type presets
- Solar panels mapped from 2D layout onto 3D roof
- Animated sun with directional lighting and shadows
- Time-of-day slider (sunrise → sunset)
- Season/date selection
- Per-panel wattage calculation based on sun position
- GPS location input
- Touch orbit controls for 3D camera
- Realistic production calculation on Production screen too

**Out of scope (future):**
- Weather API / cloud simulation
- Custom roof geometry editor
- Shading from trees/buildings
- Temperature derating
- Historical data / graphs
- Multi-roof-plane arrays
