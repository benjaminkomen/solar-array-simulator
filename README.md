# Solar Panel Array Layout

A React Native (Expo) mobile application for creating and managing solar panel array layouts with micro inverter tracking.

## Project Vision

### Overview

This app provides two ways to create a solar panel array layout:

1. **Upload** - Photograph an existing installation
2. **Custom** - Design a layout from scratch

### Upload Flow

Users can capture or select a photo of their solar panel array installation:

- **Camera capture**: Take a photo directly using the phone's camera
- **Image selection**: Choose an existing image from the phone's gallery

#### Identification Requirements

The photographed array should include stickers with **barcodes or QR codes** that identify each micro inverter. This enables automatic recognition and serial number extraction.

#### Micro Inverter Configurations

The system supports two configurations:

| Configuration | Description |
|---------------|-------------|
| 1:1 | One micro inverter per solar panel |
| 1:2 | One micro inverter serving two solar panels |

#### Post-Processing View

After uploading and AI processing, users see an **interactive representation** of their array layout:

- Draggable visualizations of solar panels and micro inverters
- When a micro inverter serves two panels (1:2), the unit moves as a single block
- **Compass indicator** showing orientation (N, E, S, W) to clarify the array's facing direction

### Custom Creation Flow

For manual array design, users have access to a full-featured canvas editor:

#### Canvas Features

| Feature | Description |
|---------|-------------|
| **Add panels** | Tap + button to add new panels at the center of the viewport |
| **Drag panels** | Touch and drag to reposition panels |
| **Rotate panels** | Toggle between portrait (60x120) and landscape (120x60) orientation |
| **Delete panels** | Remove selected panels with trash button |
| **Collision detection** | Panels cannot overlap (4px minimum gap enforced) |
| **Grid snapping** | Panels snap to 30px grid on release |
| **Infinite canvas** | Pan the viewport by dragging empty space |
| **Snap to origin** | Location button centers view on first panel |

#### Panel Visualization

Solar panels are rendered as:

- Blue rectangles with **1:2 aspect ratio** (portrait) or 2:1 (landscape)
- Rounded corners with a border
- Internal grid pattern: 1 vertical line + 3 horizontal lines
- Amber highlight border when selected

#### Toolbar Controls

| Button | Placement | Action |
|--------|-----------|--------|
| + | Bottom | Add new panel |
| Rotate | Bottom (when selected) | Rotate panel 90° |
| Trash | Bottom (when selected) | Delete panel |
| Location | Right header | Center viewport on first panel |

### Energy Simulation

After creating an array layout (via either method), users can run a **power production simulation**. Required inputs:

| Parameter | Description |
|-----------|-------------|
| Location | City + Country |
| Season | Summer, Spring, Fall, or Winter |
| Orientation | Direction the array is facing |

The simulation calculates and displays the estimated **Watt output per panel**.

### Panel Details

Users can tap any solar panel to view a **bottom sheet / form sheet** containing:

- Serial number (from micro inverter)
- Additional metadata and specifications

### Configuration Screen

A dedicated configuration screen allows users to manage system settings:

#### Panel Settings
- Configure default maximum wattage per micro-inverter/panel

#### Micro-inverter Management
- View list of all configured micro-inverters with serial numbers and efficiency
- Add new micro-inverters with custom serial number and efficiency
- Edit existing micro-inverters (serial number, efficiency slider)
- Swipe-to-delete functionality for removing inverters
- Native iOS Form UI with SwiftUI components

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
│   ├── _layout.tsx        # Root layout with transparent header
│   ├── index.tsx          # Home screen with Upload/Custom options
│   ├── upload.tsx         # Image capture, analysis, and processing overlay
│   ├── custom.tsx         # Custom canvas editor with toolbar
│   ├── config.tsx         # Configuration screen with SwiftUI Form
│   └── api/
│       └── analyze+api.ts # Bedrock API route (Claude vision analysis)
├── components/
│   ├── OptionCard.tsx     # Home screen option cards
│   ├── ImagePreview.tsx   # Image preview component
│   ├── PermissionModal.tsx # Camera permission modal
│   ├── ProcessingOverlay.tsx # Fibonacci shader + shimmer text overlay
│   ├── SolarPanel.tsx     # Skia panel rendering with rotation
│   └── SolarPanelCanvas.tsx # Main canvas with gesture handling
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
    └── panelUtils.ts      # Panel dimensions, hit testing, positioning
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
- [x] Add processing overlay with fibonacci shader animation
- [x] Integrate AWS Bedrock for image analysis (Claude Sonnet 4.5)
- [x] Set up Expo API route for server-side Bedrock calls
- [x] Add Terraform config for IAM resources
- [x] Add configuration screen with micro-inverter management
- [ ] Deploy API routes to EAS Hosting
- [ ] Implement compass orientation indicator
- [ ] Create panel detail bottom sheet
- [ ] Build energy simulation engine

---

## License

MIT
