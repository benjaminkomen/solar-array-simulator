# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Start Expo development server
bun start

# Run on specific platforms
bun ios      # iOS simulator (opens dev build)
bun android  # Android emulator (opens dev build)
bun web      # Web browser

# Lint
bun run lint

# Type check
./node_modules/.bin/tsc --noEmit

# Maestro E2E tests
bun run test:maestro
```

**⚠️ IMPORTANT - Development Build Workflow:**

This project uses **development builds** (Expo dev client), NOT bare `npx expo run:ios` builds.

- **Local development**: Start dev server (`bun start`), open development build on simulator
- **DO NOT run**: `npx expo run:ios`, `npx expo run:android`, or `eas build --local` for local dev
- **CI/CD only**: The EAS Workflow uses `preview-simulator` profile (standalone builds without dev client)

## Architecture

This is an Expo Router v55 preview app for creating solar panel array layouts. Uses React Native New Architecture with React Compiler enabled.

### Key Technologies

- **Expo Router v55 preview** - `Stack.Screen`, `Stack.Toolbar`, `Link.Trigger` with `withAppleZoom`
- **React Native Reanimated** - SharedValues for smooth 60fps animations
- **React Native Gesture Handler** - Pan and tap gestures for canvas interactions
- **expo-image** - Optimized image rendering
- **expo-haptics** - iOS haptic feedback on interactions
- **expo-image-picker** - Camera capture and gallery selection with permission handling
- **@shopify/react-native-skia** - High-performance 2D canvas for solar panel layout
- **@ai-sdk/amazon-bedrock** - Claude on AWS Bedrock for image analysis (no AWS SDK dependency)
- **expo-image-manipulator** - Client-side image resize before upload

### Project Structure

```
src/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with transparent header
│   ├── index.tsx           # Home screen (Upload/Custom options)
│   ├── upload.tsx          # Image capture + Bedrock analysis
│   ├── custom.tsx          # Canvas editor with toolbar
│   └── api/
│       └── analyze+api.ts  # Bedrock API route (Claude vision)
├── components/
│   ├── OptionCard.tsx      # Home screen cards
│   ├── ImagePreview.tsx    # Image preview
│   ├── PermissionModal.tsx # Camera permission UI
│   ├── ProcessingOverlay.tsx # Fibonacci shader + shimmer text
│   ├── SolarPanel.tsx      # Skia panel with rotation
│   └── SolarPanelCanvas.tsx # Main canvas + gestures
├── hooks/
│   ├── useImagePicker.ts   # Camera/gallery hook
│   └── usePanelsManager.ts # Panel state management
└── utils/
    ├── analysisStore.ts    # Module-level store for analysis results
    ├── collision.ts        # AABB collision detection
    ├── gridSnap.ts         # Grid snap utilities
    ├── imageResize.ts      # Client-side image resize for upload
    └── panelUtils.ts       # Panel helpers
```

Path alias: `@/*` maps to `./src/*`

## Canvas System

### Core Components

**SolarPanelCanvas** (`src/components/SolarPanelCanvas.tsx`)
- Skia Canvas wrapped in GestureDetector
- Handles both panel dragging and viewport panning
- Converts screen coordinates to world coordinates for hit testing
- Applies viewport transform to all panel rendering

**SolarPanel** (`src/components/SolarPanel.tsx`)
- Renders a single panel with Skia primitives
- Supports rotation (0° portrait, 90° landscape)
- Shows amber border when selected

**usePanelsManager** (`src/hooks/usePanelsManager.ts`)
- Manages panel array state with SharedValues for x, y, rotation
- `addPanel()` - finds free position using spiral search
- `removePanel()` - deletes panel
- `rotatePanel()` - toggles 0°↔90° with smart repositioning
- `bringToFront()` - moves selected panel to top of z-order

### Key Constants

```typescript
// Panel dimensions (src/utils/panelUtils.ts)
PANEL_WIDTH = 60    // Portrait width
PANEL_HEIGHT = 120  // Portrait height

// Grid (src/utils/gridSnap.ts)
GRID_SIZE = 30      // Snap grid in pixels

// Collision (src/utils/collision.ts)
PANEL_GAP = 4       // Minimum gap between panels
```

### Gesture Behavior

1. **Tap on panel** → Select panel, show rotate/delete buttons
2. **Tap on empty space** → Deselect panel
3. **Drag panel** → Move with collision prevention, snap on release
4. **Drag empty space** → Pan the infinite canvas viewport

### Collision Detection

- AABB (Axis-Aligned Bounding Box) collision
- 4px minimum gap enforced between panels
- Collision checked during drag (blocks invalid moves)
- Collision checked on grid snap (prevents snap into collision)
- Rotation checks for valid position, moves panel if needed

### Worklet Functions

Functions marked with `"worklet"` run on the UI thread:
- `rectsOverlap()` - collision check
- `collidesWithAny()` - batch collision check
- `snapToGrid()` - grid alignment
- `getPanelDimensions()` - width/height based on rotation
- `hitTestPanels()` - find panel at touch point

## Navigation & Toolbar

### Stack.Toolbar (Expo Router v55)

```tsx
// Bottom toolbar with conditional buttons
<Stack.Toolbar placement="bottom">
  <Stack.Toolbar.Button icon="plus" onPress={addPanel} />
  {selectedId && (
    <>
      <Stack.Toolbar.Button icon="rotate.right" onPress={rotate} />
      <Stack.Toolbar.Button icon="trash" onPress={delete} />
    </>
  )}
</Stack.Toolbar>

// Right header button
<Stack.Toolbar placement="right">
  <Stack.Toolbar.Button icon="location" onPress={snapToOrigin} />
</Stack.Toolbar>
```

### SF Symbols

Toolbar buttons use iOS SF Symbols for icons:
- `plus` - Add panel
- `rotate.right` - Rotate panel
- `trash` - Delete panel
- `location` - Snap to first panel

## API Route — Image Analysis

### `src/app/api/analyze+api.ts`

Expo API route that sends an uploaded photo to Claude Sonnet 4.5 on AWS Bedrock for vision analysis.

- **Model**: `us.anthropic.claude-sonnet-4-5-20250929-v1:0` (cross-region inference profile)
- **SDK**: `@ai-sdk/amazon-bedrock` v4+ (no AWS SDK dependency, works on Cloudflare Workers)
- **Input**: Base64-encoded JPEG image (resized client-side to max 1568px long edge)
- **Output**: JSON with `panels[]` array containing `{ x, y, width, height, rotation, label }`

### Environment Variables

Required for the API route (set in `.env` for local dev, EAS Secrets for production):

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |

### Local Development

```bash
# Start API routes + native app
npx expo serve

# Test API route directly
curl -X POST http://localhost:8081/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"<base64>","mimeType":"image/jpeg"}'
```

### Infrastructure

Terraform config in `terraform/` creates an IAM user with minimal `bedrock:InvokeModel` permissions. See `terraform/README.md` for setup instructions.

## CI/CD

### EAS Workflow

Automated testing runs on every push to `main` via `.eas/workflows/maestro-tests.yml`.

**Workflow Structure:**
```yaml
lint → typecheck → fingerprint → get-build → build (conditional) → maestro-test
```

**Jobs:**
- `lint`: Runs `bun run lint`
- `typecheck`: Runs `tsc --noEmit`
- `fingerprint`: Calculates native code hash (Expo fingerprinting)
- `get-build`: Searches for existing build with matching fingerprint
- `build`: Creates iOS simulator build (only if no matching build found)
- `maestro_test`: Runs `.maestro/` tests on simulator

**Build Caching:**
- Fingerprinting caches builds by native code hash
- JS-only changes reuse existing builds (fast: ~2-5 min)
- Native changes trigger new builds (slower: ~10-15 min)
- First push always creates a new build

**Viewing Runs:**
```
https://expo.dev/accounts/benjaminkomen/projects/react-native-array-layout-2/workflows
```

### Maestro Tests

E2E tests live in `.maestro/` directory. Current coverage:
- Smoke test: app launch, home screen, navigation to upload/custom screens

**Run locally:**

**IMPORTANT**: This project uses development builds. DO NOT use `npx expo run:ios` or `eas build --local` for local development.

```bash
# Install Maestro (one-time setup)
curl -Ls "https://get.maestro.mobile.dev" | bash

# For local testing:
# 1. Start dev server
bun start

# 2. Open development build on simulator (connects to dev server)
# 3. Run Maestro tests
bun run test:maestro
```

**Note**: The CI/CD workflow uses `preview-simulator` profile which creates standalone builds without dev client.

## Planned Integrations

- **EAS Hosting** - Server-side API route deployment
- **Compass indicator** - Array orientation display
- **Panel detail sheet** - Bottom sheet with serial number and metadata
- **Energy simulation** - Power production estimates per panel
