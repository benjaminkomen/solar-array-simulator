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
```

## Architecture

This is an Expo Router v55 preview app for creating solar panel array layouts. Uses React Native New Architecture with React Compiler enabled.

### Key Technologies

- **Expo Router v55 preview** - New `Stack.Screen` components (Title) and `Link.Trigger` with `withAppleZoom`
- **React Native Reanimated** - Entrance animations via `FadeIn` (no shared transitions needed)
- **React Native Gesture Handler** - Touch interactions
- **expo-image** - Optimized image rendering
- **expo-haptics** - iOS haptic feedback on interactions
- **expo-image-picker** - Camera capture and gallery selection with permission handling
- **@shopify/react-native-skia** - High-performance 2D canvas for solar panel layout

### Project Structure

- `src/app/` - Expo Router file-based routes (Stack navigation)
- `src/app/_layout.tsx` - Root layout with transparent header
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- Path alias: `@/*` maps to `./src/*`

### Navigation Pattern & Link Behavior

- **Link.Trigger with `withAppleZoom`** - Provides built-in zoom animation on navigation (iOS 18+)
- **Stack.Screen.Title** - Set screen title inside components (Expo Router v55 feature)
- **Transparent header** - Minimal, clean header with system blur effect
- No shared element transitions - `withAppleZoom` handles navigation animation smoothly

### Running the App

Requires Expo Go with Expo Router v55 preview support, or create a custom development build:
```bash
bun start  # Start dev server
# Scan QR code in Expo Go (ensure you have recent version)
```

### Planned Integrations

- **AWS Bedrock** - AI image analysis via Expo API Routes
- **EAS Hosting** - Server-side API route deployment
