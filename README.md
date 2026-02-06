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

For manual array design, users have immediate access to:

- **Toolbar** with drag-and-drop solar panel / micro inverter elements
- **Canvas** for placing and arranging components
- **Snap-to-grid** functionality for precise alignment
- **Orientation toggle** for portrait or landscape panel placement

#### Panel Visualization

Solar panels are rendered as:

- Blue rectangles with **1:2 aspect ratio** (portrait) or 2:1 (landscape)
- Rounded corners with a border
- Internal grid pattern: 1 vertical line + 3 horizontal lines

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

---

## Technical Architecture

### Canvas & Interactions

| Library | Purpose |
|---------|---------|
| [React Native Skia](https://shopify.github.io/react-native-skia/) | High-performance 2D graphics rendering for the canvas |
| [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | Touch gestures for drag, tap, and pan interactions |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Smooth 60fps animations and gesture-driven motion |

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
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── upload.tsx
│   └── custom.tsx
├── components/
│   ├── OptionCard.tsx
│   ├── ImagePreview.tsx
│   ├── PermissionModal.tsx
│   └── SolarPanel.tsx
└── hooks/
    └── useImagePicker.ts
```

---

## Roadmap

- [x] Implement camera capture and image picker
- [ ] Integrate AWS Bedrock for image analysis
- [ ] Build Skia canvas with draggable panels
- [ ] Add snap-to-grid and orientation controls
- [ ] Implement compass orientation indicator
- [ ] Create panel detail bottom sheet
- [ ] Build energy simulation engine
- [ ] Set up API routes with EAS hosting

---

## License

MIT
