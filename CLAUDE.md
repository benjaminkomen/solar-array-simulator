# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Start Expo development server
bun start

# Run on specific platforms
bun ios      # iOS simulator
bun android  # Android emulator
bun web      # Web browser

# Lint
bun run lint

# Type check
./node_modules/.bin/tsc --noEmit
```

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

### Project Structure

```
src/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with transparent header
│   ├── index.tsx           # Home screen (Upload/Custom options)
│   ├── upload.tsx          # Image capture screen
│   └── custom.tsx          # Canvas editor with toolbar
├── components/
│   ├── OptionCard.tsx      # Home screen cards
│   ├── ImagePreview.tsx    # Image preview
│   ├── PermissionModal.tsx # Camera permission UI
│   ├── SolarPanel.tsx      # Skia panel with rotation
│   └── SolarPanelCanvas.tsx # Main canvas + gestures
├── hooks/
│   ├── useImagePicker.ts   # Camera/gallery hook
│   └── usePanelsManager.ts # Panel state management
└── utils/
    ├── collision.ts        # AABB collision detection
    ├── gridSnap.ts         # Grid snap utilities
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

## Planned Integrations

- **AWS Bedrock** - AI image analysis via Expo API Routes
- **EAS Hosting** - Server-side API route deployment
