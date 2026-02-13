# Solar Panel Array Layout

A React Native (Expo) mobile application for creating and managing solar panel array layouts with micro inverter tracking.

## User Flow

The app guides you through a 3-step wizard to create and monitor your solar panel array:

```mermaid
flowchart TD
    START([Launch App]) --> CHECK{Wizard Completed?}
    CHECK --> |No| WELCOME[Welcome Screen]
    CHECK --> |Yes| PRODUCTION[Production Monitor]
    WELCOME --> |Get Started| CONFIG[1. Configure]
    CONFIG --> |Continue| UPLOAD[2. Photo]
    UPLOAD --> |Take photo| CUSTOM[3. Layout]
    UPLOAD --> |Skip| CUSTOM
    CUSTOM --> |Finish| PRODUCTION
    PRODUCTION --> |Edit| CONFIG
    PRODUCTION --> |Delete| WELCOME

    style WELCOME fill:#f0f0ff,stroke:#6366f1
    style CONFIG fill:#4ade80,stroke:#22c55e
    style UPLOAD fill:#60a5fa,stroke:#3b82f6
    style CUSTOM fill:#f59e0b,stroke:#d97706
    style PRODUCTION fill:#a855f7,stroke:#9333ea
```

### Welcome Screen

New users see a welcome screen with:
- Hero icon and app title
- "Get Started" button to begin the wizard

Returning users are taken directly to the Production Monitor.

### Step 1: Configuration

Start by configuring your micro-inverters:
- Add micro-inverters with their 8-digit serial numbers
- Set efficiency ratings (0-100%) for each inverter
- Configure default panel wattage

### Step 2: Upload (Optional)

Photograph your existing array for AI-powered layout generation:
- Take a photo or select from gallery
- AI analyzes the image to detect panel positions
- Automatically matches panel labels to inverter serial numbers
- Skip this step to create a layout manually

### Step 3: Canvas Editor (Required)

Create or confirm your panel layout:
- **From Upload**: Review AI-generated layout, make adjustments
- **Manual**: Add panels, arrange them on the canvas
- Link each panel to its micro-inverter
- Drag to reposition (can drag over other panels), snap on release
- If dropped in invalid position, panel reverts to original location
- Rotate panels, use grid snapping
- Zoom in/out (3 levels) to view large arrays on smaller screens
- **Compass indicator** in top-right corner to set array orientation (tap for help)

### Production Monitor

After completing the wizard, view real-time power production:
- **Auto-centered viewport** - On load, centers on all panels for optimal visibility
- **Total array output** displayed prominently at top
- Same canvas view as editor, but read-only (no editing)
- **Compass indicator** shows saved array orientation (read-only)
- Each panel displays current wattage with color coding:
  - Green: High output (>80% efficiency)
  - Yellow: Medium output (40-80%)
  - Red: Low output (<40%)
  - Gray: Unlinked panels (0W)
- **Tap any panel** to view its linked inverter details (serial number, efficiency)
- Production updates every second with realistic fluctuation
- Formula: `efficiency × maxWattage × (0.95 + random × 0.1)`
- **Menu options** (three-dots button in top-right):
  - **Edit Configuration**: Re-enter the wizard flow to modify your setup
  - **Delete Configuration**: Clear all data and start fresh

---

## Technical Architecture

### Canvas & Interactions

| Library | Purpose |
|---------|---------|
| [React Native Skia](https://shopify.github.io/react-native-skia/) | High-performance 2D graphics rendering for the canvas |
| [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | Touch gestures for drag, tap, and pan interactions |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Smooth 60fps animations and gesture-driven motion |

#### Canvas Implementation

The custom canvas is built with:

- **SolarPanelCanvas** - Main canvas component with gesture handling
- **SolarPanel** - Individual panel rendering with rotation support
- **usePanelsManager** - State management hook for panel CRUD operations
- **Collision utilities** - AABB collision detection with gap enforcement
- **Grid snapping** - 30px grid alignment on gesture end

### AI / Image Processing

| Service | Purpose |
|---------|---------|
| [AWS Bedrock](https://aws.amazon.com/bedrock/) | Hosts the AI model that analyzes uploaded photos |

The AI agent processes uploaded images to:

1. Detect solar panel positions and boundaries
2. Read barcode/QR code stickers
3. Extract micro inverter serial numbers
4. Output coordinate data and panel-to-inverter mappings

### Backend / API

| Technology | Purpose |
|------------|---------|
| [Expo API Routes](https://docs.expo.dev/router/reference/api-routes/) | Server-side endpoints within the Expo Router |
| [EAS Hosting](https://docs.expo.dev/eas/) | Secure deployment for API routes |

API routes handle:

- Secure communication with AWS Bedrock (keeping credentials server-side)
- Image upload and processing requests
- Simulation data retrieval

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh/) (recommended) or npm
- Expo CLI
- iOS Simulator / Android Emulator or physical device

### Installation

```bash
# Clone the repository
git clone https://github.com/benjaminkomen/react-native-array-layout-2.git
cd react-native-array-layout-2

# Install dependencies
bun install

# Start the development server
bun start
```

### Running the App

```bash
# iOS
bun ios

# Android
bun android

# Web
bun web
```

---

## Project Structure

```
src/
├── app/
│   ├── _layout.tsx        # Root layout with PanelsProvider
│   ├── index.tsx          # Welcome screen (redirects returning users)
│   ├── config.tsx         # Step 1: Configuration (SwiftUI Form)
│   ├── upload.tsx         # Step 2: Upload & AI analysis
│   ├── custom.tsx         # Step 3: Canvas editor with toolbar
│   ├── production.tsx     # Production monitor (real-time wattage)
│   ├── panel-details.tsx  # Form sheet: View/link panel to inverter
│   ├── compass-help.tsx   # Form sheet: Compass usage instructions
│   └── api/
│       └── analyze+api.ts # Bedrock API route (Claude vision analysis)
├── components/
│   ├── Compass.tsx        # Interactive compass for array orientation
│   ├── ImagePreview.tsx   # Image preview component
│   ├── PermissionModal.tsx # Camera permission modal
│   ├── ProcessingOverlay.tsx # Fibonacci shader + shimmer text overlay
│   ├── ProductionCanvas.tsx # Read-only canvas for production view
│   ├── ProductionPanel.tsx # Panel with wattage display
│   ├── SolarPanel.tsx     # Skia panel rendering with rotation
│   ├── SolarPanelCanvas.tsx # Main canvas with gesture handling
│   ├── WizardProgress.tsx # 3-step progress indicator
│   └── ZoomControls.tsx   # Floating zoom +/- controls
├── hooks/
│   ├── useConfigStore.ts  # Configuration store hook (inverters, wattage)
│   ├── useImagePicker.ts  # Camera and gallery picker hook
│   └── usePanelsManager.ts # Panel state management (CRUD)
└── utils/
    ├── analysisStore.ts   # Module-level store for passing analysis results
    ├── collision.ts       # AABB collision detection
    ├── configStore.ts     # Persistent config store (expo-sqlite/kv-store)
    ├── gridSnap.ts        # Grid snapping utilities
    ├── imageResize.ts     # Client-side image resize for upload
    ├── panelUtils.ts      # Panel dimensions, hit testing, positioning
    └── zoomConstants.ts   # Zoom level scale factors
terraform/
├── main.tf                # IAM user + Bedrock policy + S3 backend
├── variables.tf           # AWS region variable
├── outputs.tf             # Access key outputs
├── backend.hcl.example    # S3 backend config template
└── README.md              # Terraform setup instructions
```

---

## Roadmap

- [x] Implement camera capture and image picker
- [x] Build Skia canvas with draggable panels
- [x] Add collision detection with gap enforcement
- [x] Implement grid snapping (30px)
- [x] Add panel rotation (portrait/landscape)
- [x] Implement infinite canvas with viewport panning
- [x] Add snap-to-origin button
- [x] Add 3-level zoom controls for Custom and Production screens
- [x] Add processing overlay with fibonacci shader animation
- [x] Integrate AWS Bedrock for image analysis (Claude Sonnet 4.5)
- [x] Set up Expo API route for server-side Bedrock calls
- [x] Add Terraform config for IAM resources
- [x] Add configuration screen with micro-inverter management
- [x] Implement production monitor screen
  - View-only canvas showing panel layout
  - Real-time wattage display per panel with color coding
  - Total array output display
  - Mock data: efficiency × wattage with fluctuation
- [x] Add wizard flow with progress indicator
  - Welcome screen for new users
  - 3-step progress indicator (Configure → Photo → Layout)
  - Navigation buttons (Continue, Skip, Finish)
  - wizardCompleted flag for returning users
- [x] Create panel details form sheet
  - Unified form sheet for viewing and linking inverters
  - Dynamic sheet height: 30% for view mode, 60% for edit mode
  - Uses native @expo/ui/swift-ui components
  - Tap panels in Production screen to view inverter details
- [x] Implement compass orientation indicator
  - Interactive compass in top-right of Custom screen
  - Drag arrow to set array orientation (snaps to 8 directions)
  - Tap for help sheet with usage instructions
  - Read-only compass on Production screen
- [ ] Deploy API routes to EAS Hosting

---

## License

MIT
